/*global expect*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const mockFs = require('mock-fs');
const knex = require('../../../knex');

describe('Seeder.loadExtensions', function() {
  const config = {
    client: 'postgres',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
    seeds: {
      directory: 'test/integration/seed/seeds',
    },
  };
  let seeder;

  before(function() {
    mockFs({
      'test/integration/seed/seeds': {
        'co-seed.co': 'co seed content',
        'coffee-seed.coffee': 'coffee seed content',
        'eg-seed.eg': 'eg seed content',
        'iced-seed.iced': 'iced seed content',
        'js-seed.js': 'js seed content',
        'litcoffee-seed.litcoffee': 'litcoffee seed content',
        'ls-seed.ls': 'ls seed content',
        'ts-seed.ts': 'ts seed content',
        'useless.txt': 'i am not a seed',
      },
    });
  });

  after(function() {
    mockFs.restore();
  });

  beforeEach(function() {
    seeder = knex(config).seed;
  });

  it('should include all supported extensions by default', function() {
    return seeder._listAll().then(function(list) {
      expect(list).to.eql([
        'co-seed.co',
        'coffee-seed.coffee',
        'eg-seed.eg',
        'iced-seed.iced',
        'js-seed.js',
        'litcoffee-seed.litcoffee',
        'ls-seed.ls',
        'ts-seed.ts',
      ]);
    });
  });

  it('should list only files with specified extensions', function() {
    return seeder
      ._listAll({ loadExtensions: ['.ts', '.js'] })
      .then(function(list) {
        expect(list).to.eql(['js-seed.js', 'ts-seed.ts']);
      });
  });
});

describe('Seeder._waterfallBatch', function() {
  const config = {
    client: 'postgres',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
    seeds: {
      directory: 'test/unit/seed/test',
    },
  };
  let seeder;

  beforeEach(function() {
    seeder = knex(config).seed;
  });

  it('should throw an error with correct file name', (done) => {
    seeder._waterfallBatch(['1-first.js', '2-second.js']).catch((error) => {
      expect(error.message).to.match(
        /^Error while executing .*1-first.js" seed: throwing in first file$/
      );
      done();
    });
  });
});

describe('When there are multiple directories', function() {

  const config = {
    client: 'postgres',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
    seeds: {
      directory: ['test/integration/seed/seeds/production', 'test/integration/seed/seeds/test'],
      sortDirsSeparately: true,
    },
  };

  let seeder;

  before(function() {
    mockFs({
      'test/integration/seed/seeds/production': {
        '001-js-seed-prod.js': 'js seed content',
        '002-js-seed-prod.js': 'js seed content',
      },
      'test/integration/seed/seeds/test': {
        '001-js-seed-test.js': 'js seed content',
        '002-js-seed-test.js': 'js seed content',
      }
    });
  });

  after(function() {
    mockFs.restore();
  });

  beforeEach(function() {
    seeder = knex(config).seed;
  });

  describe('Seeder._absoluteConfigDirs', function() {

    it('should yield a list of directories', async () => {
      const list = await seeder._absoluteConfigDirs();
      expect(list[0]).to.equal(process.cwd() + '/test/integration/seed/seeds/production');
      expect(list[1]).to.equal(process.cwd() + '/test/integration/seed/seeds/test');
    });

  });

  describe('Seeder._listAll', function() {

    it('should list all files in each directory, in order', async () => {

      return seeder._listAll().then(function(list) {
        expect(list).to.eql([
          '001-js-seed-prod.js',
          '002-js-seed-prod.js',
          '001-js-seed-test.js',
          '002-js-seed-test.js',
        ]);
      });

    });

    describe('When sortDirsSeperately is not true', function() {
      it('should list all files in each directory, in order', async () => {
        seeder = knex(Object.assign(
          {},
          config,
          {
            seeds: {
              directory: ['test/integration/seed/seeds/production', 'test/integration/seed/seeds/test'],
              sortDirsSeparately: false
            }
          })).seed;


        return seeder._listAll().then(function(list) {
          expect(list).to.eql([
            '001-js-seed-prod.js',
            '001-js-seed-test.js',
            '002-js-seed-prod.js',
            '002-js-seed-test.js',
          ]);
        });
      });
    });
  });
});
