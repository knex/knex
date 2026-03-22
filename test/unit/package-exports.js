const { resolve } = require('resolve.exports');
const { expect } = require('chai');
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
        expect(result).to.be.an('array');
        expect(result[0]).to.equal(`./lib/dialects/${dialect}/index.js`);
      });

      it(`resolves knex/lib/dialects/${dialect}/index.js (with extension)`, () => {
        const result = resolve(pkg, `./lib/dialects/${dialect}/index.js`);
        expect(result).to.be.an('array');
        expect(result[0]).to.equal(`./lib/dialects/${dialect}/index.js`);
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
          expect(result).to.be.an('array');
          expect(result[0]).to.equal(`./${subpath}`);
        });

        const noExt = subpath.replace(/\.js$/, '');
        it(`resolves knex/${noExt} (extensionless)`, () => {
          const result = resolve(pkg, `./${noExt}`);
          expect(result).to.be.an('array');
          expect(result[0]).to.equal(`./${subpath}`);
        });
      });
  });

  describe('main entry points', () => {
    it('resolves knex (main)', () => {
      const result = resolve(pkg, '.');
      expect(result).to.be.an('array');
    });

    it('resolves knex/knex', () => {
      const result = resolve(pkg, './knex');
      expect(result).to.be.an('array');
      expect(result[0]).to.equal('./knex.js');
    });

    it('resolves knex/package.json', () => {
      const result = resolve(pkg, './package.json');
      expect(result).to.be.an('array');
      expect(result[0]).to.equal('./package.json');
    });
  });

  describe('exports map structure', () => {
    it('maps extensionless imports to .js files', () => {
      expect(pkg.exports['./lib/*']).to.equal('./lib/*.js');
    });

    it('maps .js imports directly', () => {
      expect(pkg.exports['./lib/*.js']).to.equal('./lib/*.js');
    });

    it('resolved paths point to real files', () => {
      // Verify the exact scenario from knex-cloudflare-d1
      const result = resolve(pkg, './lib/dialects/sqlite3/index');
      const resolved = result[0];
      const fullPath = path.join(ROOT, resolved);
      expect(fs.existsSync(fullPath)).to.be.true;
    });
  });
});
