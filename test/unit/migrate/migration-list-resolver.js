/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const chai = require('chai');
const chaiSubset = require('chai-subset-in-order');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const migrationListResolver = require('../../../lib/migrate/migration-list-resolver');
const FsMigrations = require('../../../lib/migrate/sources/fs-migrations')
  .FsMigrations;
const path = require('path');

chai.use(chaiSubset);

describe('migration-list-resolver', () => {
  describe('listAll', () => {
    let migrationSource;
    before(() => {
      migrationSource = new FsMigrations('test/integration/migrate/migration');
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
      return migrationListResolver.listAll(migrationSource).then((list) => {
        expect(list).to.eql([
          'co-migration.co',
          'coffee-migration.coffee',
          'eg-migration.eg',
          'iced-migration.iced',
          'js-migration.js',
          'litcoffee-migration.litcoffee',
          'ls-migration.ls',
          'ts-migration.ts',
        ]);
      });
    });

    it('should include only files with specified extensions', function() {
      return migrationListResolver
        .listAll(migrationSource, ['.ts', '.js'])
        .then((list) => {
          expect(list).to.eql([
            'js-migration.js',
            'ts-migration.ts',
          ]);

          expect(list[0].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
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
            '001_migration.js',
            '002_migration.js',
            '003_migration.js',
            '004_migration.js',
            '005_migration.js',
            '006_migration.js',
          ]);

          expect(list[0].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
          expect(list[1].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/seeds'
          );
          expect(list[2].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/seeds'
          );
          expect(list[3].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/seeds'
          );
        });
    });

    it('should include files from both folders, sorted within their folders', () => {
      return migrationListResolver
        .listAll(absoluteConfigDirectory, ['.js'], true)
        .then((list) => {
          expect(list).to.eql([
            '001_migration.js',
            '005_migration.js',
            '006_migration.js',
            '002_migration.js',
            '003_migration.js',
            '004_migration.js',
          ]);

          expect(list[0].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
          expect(list[1].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
          expect(list[2].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
          expect(list[3].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/seeds'
          );
        });
    });
  });
});
