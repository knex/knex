/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mockFs = require('mock-fs');
const migrationListResolver = require('../../../../lib/migrations/migrate/migration-list-resolver');
const {
  FsMigrations,
} = require('../../../../lib/migrations/migrate/sources/fs-migrations');

describe('migration-list-resolver', () => {
  describe('listAll', () => {
    let migrationSource;
    before(() => {
      migrationSource = new FsMigrations('test/integration/migrate/migration');
      mockFs({
        'test/integration/migrate/migration': {
          'cjs-migration.cjs': 'cjs migration content',
          'co-migration.co': 'co migation content',
          'coffee-migration.coffee': 'coffee migation content',
          'eg-migration.eg': 'eg migation content',
          'iced-migration.iced': 'iced migation content',
          'js-migration.js': 'js migation content',
          'litcoffee-migration.litcoffee': 'litcoffee migation content',
          'ls-migration.ls': 'ls migation content',
          'ts-migration.ts': 'ts migation content',
          'useless.txt': 'i am not a migration',
        },
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should include all supported extensions by default', () => {
      return migrationListResolver.listAll(migrationSource).then((list) => {
        expect(list).to.eql([
          {
            directory: 'test/integration/migrate/migration',
            file: 'cjs-migration.cjs',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'co-migration.co',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'coffee-migration.coffee',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'eg-migration.eg',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'iced-migration.iced',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'js-migration.js',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'litcoffee-migration.litcoffee',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'ls-migration.ls',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: 'ts-migration.ts',
          },
        ]);
      });
    });

    it('should include only files with specified extensions', function () {
      return migrationListResolver
        .listAll(migrationSource, ['.ts', '.js'])
        .then((list) => {
          expect(list).to.eql([
            {
              directory: 'test/integration/migrate/migration',
              file: 'js-migration.js',
            },
            {
              directory: 'test/integration/migrate/migration',
              file: 'ts-migration.ts',
            },
          ]);
        });
    });
  });

  describe('listAll - multiple directories', () => {
    before(() => {
      mockFs({
        'test/integration/migrate/migration': {
          '006_migration.js': 'dummy',
          '001_migration.js': 'dummy',
          '005_migration.js': 'dummy',
        },
        'test/integration/migrate/seeds': {
          '004_migration.js': 'dummy',
          '002_migration.js': 'dummy',
          '003_migration.js': 'dummy',
        },
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should include files from both folders, sorted globally', () => {
      const migrationSource = new FsMigrations([
        'test/integration/migrate/migration',
        'test/integration/migrate/seeds',
      ]);

      return migrationListResolver.listAll(migrationSource).then((list) => {
        expect(list).to.eql([
          {
            directory: 'test/integration/migrate/migration',
            file: '001_migration.js',
          },
          {
            directory: 'test/integration/migrate/seeds',
            file: '002_migration.js',
          },
          {
            directory: 'test/integration/migrate/seeds',
            file: '003_migration.js',
          },
          {
            directory: 'test/integration/migrate/seeds',
            file: '004_migration.js',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: '005_migration.js',
          },
          {
            directory: 'test/integration/migrate/migration',
            file: '006_migration.js',
          },
        ]);
      });
    });

    it('should include files from both folders, sorted within their folders', () => {
      const migrationSource = new FsMigrations(
        [
          'test/integration/migrate/migration',
          'test/integration/migrate/seeds',
        ],
        true
      );

      return migrationListResolver
        .listAll(migrationSource, ['.js'])
        .then((list) => {
          expect(list).to.eql([
            {
              directory: 'test/integration/migrate/migration',
              file: '001_migration.js',
            },
            {
              directory: 'test/integration/migrate/migration',
              file: '005_migration.js',
            },
            {
              directory: 'test/integration/migrate/migration',
              file: '006_migration.js',
            },
            {
              directory: 'test/integration/migrate/seeds',
              file: '002_migration.js',
            },
            {
              directory: 'test/integration/migrate/seeds',
              file: '003_migration.js',
            },
            {
              directory: 'test/integration/migrate/seeds',
              file: '004_migration.js',
            },
          ]);
        });
    });
  });

  describe('listAllAndCompleted', () => {
    it('should pass loadExtensions param to listAll', () => {
      after(() => {
        sinon.restore();
      });

      const migrationSource = new FsMigrations([], true);

      const stub = sinon
        .stub(migrationSource, 'getMigrations')
        .callsFake(async () => true);
      return migrationListResolver
        .listAll(migrationSource, ['.ts'])
        .then(() => {
          sinon.assert.calledWith(stub, ['.ts']);
        });
    });
  });
});
