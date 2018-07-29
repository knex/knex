/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const mockFs = require('mock-fs');
const migrationListResolver = require('../../../lib/migrate/migration-list-resolver');
const path = require('path');

describe('migration-list-resolver', () => {
  describe('listAll - single directory', () => {
    let absoluteConfigDirectory;
    before(() => {
      absoluteConfigDirectory = path.resolve(
        process.cwd(),
        'test/integration/migrate/migration'
      );
      mockFs({
        'test/integration/migrate/migration': {
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
      return migrationListResolver
        .listAll(absoluteConfigDirectory)
        .then((list) => {
          expect(list).to.eql([
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'co-migration.co',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'coffee-migration.coffee',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'eg-migration.eg',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'iced-migration.iced',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'js-migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'litcoffee-migration.litcoffee',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'ls-migration.ls',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'ts-migration.ts',
            },
          ]);
        });
    });

    it('should include only files with specified extensions', function() {
      return migrationListResolver
        .listAll(absoluteConfigDirectory, ['.ts', '.js'])
        .then((list) => {
          expect(list).to.eql([
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'js-migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: 'ts-migration.ts',
            },
          ]);
        });
    });
  });

  describe('listAll - multiple directories', () => {
    let absoluteConfigDirectory;
    before(() => {
      absoluteConfigDirectory = [
        path.resolve(process.cwd(), 'test/integration/migrate/migration'),
        path.resolve(process.cwd(), 'test/integration/migrate/seeds'),
      ];
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
      return migrationListResolver
        .listAll(absoluteConfigDirectory)
        .then((list) => {
          expect(list).to.eql([
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '001_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '002_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '003_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '004_migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '005_migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '006_migration.js',
            },
          ]);
        });
    });

    it('should include files from both folders, sorted within their folders', () => {
      return migrationListResolver
        .listAll(absoluteConfigDirectory, ['.js'], true)
        .then((list) => {
          expect(list).to.eql([
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '001_migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '005_migration.js',
            },
            {
              directory:
                'C:\\sources\\knex\\test\\integration\\migrate\\migration',
              file: '006_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '002_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '003_migration.js',
            },
            {
              directory: 'C:\\sources\\knex\\test\\integration\\migrate\\seeds',
              file: '004_migration.js',
            },
          ]);
        });
    });
  });
});
