const { resolve } = require('resolve.exports');
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

const ROOT = path.join(__dirname, '../..');

describe('package.json exports', () => {
  // Collect all dialect index files dynamically
  const dialectsDir = path.join(ROOT, 'lib/dialects');
  const dialects = fs
    .readdirSync(dialectsDir)
    .filter((d) => fs.existsSync(path.join(dialectsDir, d, 'index.js')));

  describe('dialect subpath exports resolve correctly', () => {
    dialects.forEach((dialect) => {
      it(`resolves knex/lib/dialects/${dialect}/index (extensionless)`, () => {
        const result = resolve(pkg, `./lib/dialects/${dialect}/index`);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(`./lib/dialects/${dialect}/index.js`);
      });

      it(`resolves knex/lib/dialects/${dialect}/index.js (with extension)`, () => {
        const result = resolve(pkg, `./lib/dialects/${dialect}/index.js`);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(`./lib/dialects/${dialect}/index.js`);
      });
    });
  });

  describe('common lib subpath exports', () => {
    const subpaths = [
      'lib/index.js',
      'lib/query/querybuilder.js',
      'lib/util/helpers.js',
      'lib/schema/compiler.js',
    ];

    subpaths
      .filter((p) => fs.existsSync(path.join(ROOT, p)))
      .forEach((subpath) => {
        it(`resolves knex/${subpath}`, () => {
          const result = resolve(pkg, `./${subpath}`);
          expect(Array.isArray(result)).toBe(true);
          expect(result[0]).toBe(`./${subpath}`);
        });

        const noExt = subpath.replace(/\.js$/, '');
        it(`resolves knex/${noExt} (extensionless)`, () => {
          const result = resolve(pkg, `./${noExt}`);
          expect(Array.isArray(result)).toBe(true);
          expect(result[0]).toBe(`./${subpath}`);
        });
      });
  });

  describe('bin subpath exports', () => {
    it('resolves knex/bin/cli.js', () => {
      const result = resolve(pkg, './bin/cli.js');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('./bin/cli.js');
    });

    it('resolves knex/bin/cli (extensionless)', () => {
      const result = resolve(pkg, './bin/cli');
      expect(Array.isArray(result)).toBe(true);
    });

    it('resolves knex/bin/utils/cli-config-utils.js', () => {
      const result = resolve(pkg, './bin/utils/cli-config-utils.js');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('./bin/utils/cli-config-utils.js');
    });

    it('resolves knex/bin/utils/cli-config-utils (extensionless)', () => {
      const result = resolve(pkg, './bin/utils/cli-config-utils');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('./bin/utils/cli-config-utils');
    });
  });

  describe('type subpath exports', () => {
    const typeFiles = ['types/result.d.ts', 'types/tables.d.ts'];

    typeFiles.forEach((typeFile) => {
      it(`resolves knex/${typeFile}`, () => {
        const result = resolve(pkg, `./${typeFile}`);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(`./${typeFile}`);
      });

      const noExt = typeFile.replace(/\.d\.ts$/, '');
      it(`resolves knex/${noExt} (extensionless)`, () => {
        const result = resolve(pkg, `./${noExt}`);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(`./${typeFile}`);
      });
    });
  });

  describe('main entry points', () => {
    it('resolves knex (main)', () => {
      const result = resolve(pkg, '.');
      expect(Array.isArray(result)).toBe(true);
    });

    it('resolves knex/knex', () => {
      const result = resolve(pkg, './knex');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('./knex.js');
    });

    it('resolves knex/package.json', () => {
      const result = resolve(pkg, './package.json');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('./package.json');
    });
  });

  describe('exports map structure', () => {
    it('maps extensionless imports to .js files', () => {
      expect(pkg.exports['./lib/*']).toBe('./lib/*.js');
    });

    it('maps .js imports directly', () => {
      expect(pkg.exports['./lib/*.js']).toBe('./lib/*.js');
    });

    it('resolved paths point to real files', () => {
      // Verify the exact scenario from knex-cloudflare-d1
      const result = resolve(pkg, './lib/dialects/sqlite3/index');
      const resolved = result[0];
      const fullPath = path.join(ROOT, resolved);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  describe('exported files exist on disk and are included in package files', () => {
    // Collect all concrete file paths from the exports map (including
    // conditional "import"/"require"/"types" entries). Wildcard patterns
    // like "./lib/*.js" are skipped because they are covered by glob
    // entries in the files array.
    function collectExportPaths(obj) {
      const paths = [];
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          if (!value.includes('*')) paths.push(value);
        } else if (typeof value === 'object' && value !== null) {
          paths.push(...collectExportPaths(value));
        }
      }
      return paths;
    }

    const exportedFiles = collectExportPaths(pkg.exports);

    // npm uses minimatch to evaluate the "files" array. For our purposes a
    // simplified check is sufficient: a path is covered if some entry in
    // "files" is an exact match or a glob prefix match.
    // npm always includes package.json regardless of the "files" array
    const alwaysIncluded = ['package.json'];

    function isCoveredByFiles(relPath) {
      // relPath starts with "./" — strip the leading "./"
      const stripped = relPath.replace(/^\.\//, '');
      if (alwaysIncluded.includes(stripped)) return true;
      return pkg.files.some((pattern) => {
        if (pattern.startsWith('!')) return false;
        // exact match
        if (pattern === stripped) return true;
        // directory or glob prefix (e.g. "lib/" covers "lib/foo.js")
        const prefix = pattern.replace(/\*.*$/, '');
        if (prefix && stripped.startsWith(prefix)) return true;
        return false;
      });
    }

    exportedFiles.forEach((filePath) => {
      const fullPath = path.join(ROOT, filePath);
      const display = filePath.replace(/^\.\//, '');

      it(`${display} exists on disk`, () => {
        expect(fs.existsSync(fullPath)).toBe(true);
      });

      it(`${display} is included in package.json "files"`, () => {
        expect(
          isCoveredByFiles(filePath)
        ).toBe(true);
      });
    });
  });
});
