'use strict';

const { expect } = require('chai');
const {
  FsMigrations,
} = require('../../../../../lib/migrations/migrate/sources/fs-migrations');
const mockFs = require('mock-fs');

describe('fs-migrations', () => {
  describe('getMigrationName', () => {
    let migrationSource;
    let fileNames;
    before(() => {
      migrationSource = new FsMigrations('test/integration/migrate/migration');
      fileNames = [
        'cjs-migration.cjs',
        'co-migration.co',
        'coffee-migration.coffee',
        'eg-migration.eg',
        'iced-migration.iced',
        'js-migration.js',
        'litcoffee-migration.litcoffee',
        'ls-migration.ls',
        'ts-migration.ts',
      ];
    });

    it('should return the file name without extension', () => {
      let migrationName = [];
      fileNames.forEach((filename) =>
        migrationName.push(
          migrationSource.getMigrationName({
            directory: 'test/integration/migrate/migration',
            file: filename,
          })
        )
      );
      return expect(migrationName).to.eql([
        'cjs-migration',
        'co-migration',
        'coffee-migration',
        'eg-migration',
        'iced-migration',
        'js-migration',
        'litcoffee-migration',
        'ls-migration',
        'ts-migration',
      ]);
    });
  });

  describe('getMigrations', () => {
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
      return migrationSource.getMigrations().then((list) => {
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
  });
});
