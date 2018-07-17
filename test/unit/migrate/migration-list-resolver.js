/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const mockFs = require('mock-fs');
const migrationListResolver = require('../../../lib/migrate/migration-list-resolver');
const path = require('path');

describe('migration-list-resolver', () => {
  describe('listAll', () => {
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
        .listAll(absoluteConfigDirectory, ['.ts', '.js'])
        .then((list) => {
          expect(list).to.eql(['js-migration.js', 'ts-migration.ts']);
        });
    });
  });
});
