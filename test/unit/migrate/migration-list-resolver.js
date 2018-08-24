/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const chai = require('chai');
const chaiSubset = require('chai-subset-in-order');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const migrationListResolver = require('../../../lib/migrate/migration-list-resolver');
const path = require('path');

chai.use(chaiSubset);

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
          expect(list).to.containSubsetInOrder([
            { file: 'co-migration.co' },
            { file: 'coffee-migration.coffee' },
            { file: 'eg-migration.eg' },
            { file: 'iced-migration.iced' },
            { file: 'js-migration.js' },
            { file: 'litcoffee-migration.litcoffee' },
            { file: 'ls-migration.ls' },
            { file: 'ts-migration.ts' },
          ]);

          expect(list[0].directory.replace(/\\/g, '/')).to.include(
            'knex/test/integration/migrate/migration'
          );
        });
    });

    it('should include only files with specified extensions', function() {
      return migrationListResolver
        .listAll(absoluteConfigDirectory, ['.ts', '.js'])
        .then((list) => {
          expect(list).to.containSubsetInOrder([
            { file: 'js-migration.js' },
            { file: 'ts-migration.ts' },
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
          expect(list).to.containSubsetInOrder([
            { file: '001_migration.js' },
            { file: '002_migration.js' },
            { file: '003_migration.js' },
            { file: '004_migration.js' },
            { file: '005_migration.js' },
            { file: '006_migration.js' },
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
          expect(list).to.containSubsetInOrder([
            { file: '001_migration.js' },
            { file: '005_migration.js' },
            { file: '006_migration.js' },
            { file: '002_migration.js' },
            { file: '003_migration.js' },
            { file: '004_migration.js' },
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
