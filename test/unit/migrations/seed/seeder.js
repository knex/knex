/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

const { expect } = require('chai');

const mockFs = require('mock-fs');
const knex = require('../../../../knex');
const { normalizePathArray } = require('../../../util/assertHelper');

describe('Seeder.loadExtensions', function () {
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

  before(function () {
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

  after(function () {
    mockFs.restore();
  });

  beforeEach(function () {
    seeder = knex(config).seed;
  });

  it('should include all supported extensions by default', function () {
    return seeder._listAll().then(function (list) {
      expect(normalizePathArray(list)).to.eql(
        normalizePathArray([
          process.cwd() + '/test/integration/seed/seeds/co-seed.co',
          process.cwd() + '/test/integration/seed/seeds/coffee-seed.coffee',
          process.cwd() + '/test/integration/seed/seeds/eg-seed.eg',
          process.cwd() + '/test/integration/seed/seeds/iced-seed.iced',
          process.cwd() + '/test/integration/seed/seeds/js-seed.js',
          process.cwd() +
            '/test/integration/seed/seeds/litcoffee-seed.litcoffee',
          process.cwd() + '/test/integration/seed/seeds/ls-seed.ls',
          process.cwd() + '/test/integration/seed/seeds/ts-seed.ts',
        ])
      );
    });
  });

  it('should list only files with specified extensions', function () {
    return seeder
      ._listAll({ loadExtensions: ['.ts', '.js'] })
      .then(function (list) {
        expect(normalizePathArray(list)).to.eql(
          normalizePathArray([
            process.cwd() + '/test/integration/seed/seeds/js-seed.js',
            process.cwd() + '/test/integration/seed/seeds/ts-seed.ts',
          ])
        );
      });
  });
});

describe('Seeder._waterfallBatch', function () {
  const config = {
    client: 'postgres',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
    seeds: {
      directory: 'test/unit/migrations/seed/test',
    },
  };
  let seeder;

  beforeEach(function () {
    seeder = knex(config).seed;
  });

  it('should throw an error with correct file name', (done) => {
    seeder
      ._waterfallBatch([
        process.cwd() + '/test/unit/migrations/seed/test/1-first.js',
        process.cwd() + '/test/unit/migrations/seed/test/2-second.js',
      ])
      .catch((error) => {
        expect(error.message).to.match(
          /^Error while executing .*1-first.js" seed: throwing in first file$/
        );
        done();
      });
  });
});

describe('Seeder._listAll', function () {
  const config = {
    client: 'postgres',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
    seeds: {
      directory: [
        'test/integration/seed/2-seeds',
        'test/integration/seed/1-seeds',
      ],
    },
  };
  let seeder;

  before(function () {
    mockFs({
      'test/integration/seed/': {
        '2-seeds': {
          'co-seed.co': 'co seed content',
          'coffee-seed.coffee': 'coffee seed content',
          'eg-seed.eg': 'eg seed content',
          'iced-seed.iced': 'iced seed content',
          'js-seed.js': 'js seed content',
          'litcoffee-seed.litcoffee': 'litcoffee seed content',
          'ls-seed.ls': 'ls seed content',
          'ts-seed.ts': 'ts seed content',
          'useless.txt': 'i am not a seed',
          'recursive-folder': {
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
        },
        '1-seeds': {
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
      },
    });
  });

  after(function () {
    mockFs.restore();
  });

  beforeEach(function () {
    seeder = knex(config).seed;
  });

  it('should include all supported files sorted by alphabetically order by default', function () {
    return seeder._listAll().then(function (list) {
      expect(normalizePathArray(list)).to.eql(
        normalizePathArray([
          process.cwd() + '/test/integration/seed/1-seeds/co-seed.co',
          process.cwd() + '/test/integration/seed/1-seeds/coffee-seed.coffee',
          process.cwd() + '/test/integration/seed/1-seeds/eg-seed.eg',
          process.cwd() + '/test/integration/seed/1-seeds/iced-seed.iced',
          process.cwd() + '/test/integration/seed/1-seeds/js-seed.js',
          process.cwd() +
            '/test/integration/seed/1-seeds/litcoffee-seed.litcoffee',
          process.cwd() + '/test/integration/seed/1-seeds/ls-seed.ls',
          process.cwd() + '/test/integration/seed/1-seeds/ts-seed.ts',
          process.cwd() + '/test/integration/seed/2-seeds/co-seed.co',
          process.cwd() + '/test/integration/seed/2-seeds/coffee-seed.coffee',
          process.cwd() + '/test/integration/seed/2-seeds/eg-seed.eg',
          process.cwd() + '/test/integration/seed/2-seeds/iced-seed.iced',
          process.cwd() + '/test/integration/seed/2-seeds/js-seed.js',
          process.cwd() +
            '/test/integration/seed/2-seeds/litcoffee-seed.litcoffee',
          process.cwd() + '/test/integration/seed/2-seeds/ls-seed.ls',
          process.cwd() + '/test/integration/seed/2-seeds/ts-seed.ts',
        ])
      );
    });
  });
  it('should include all supported files respecting order of directories config', function () {
    return seeder
      ._listAll({
        sortDirsSeparately: true,
      })
      .then(function (list) {
        expect(normalizePathArray(list)).to.eql(
          normalizePathArray([
            process.cwd() + '/test/integration/seed/2-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/2-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/2-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/2-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/2-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/2-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/2-seeds/ls-seed.ls',
            process.cwd() + '/test/integration/seed/2-seeds/ts-seed.ts',
            process.cwd() + '/test/integration/seed/1-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/1-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/1-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/1-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/1-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/1-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/1-seeds/ls-seed.ls',
            process.cwd() + '/test/integration/seed/1-seeds/ts-seed.ts',
          ])
        );
      });
  });
  it('should include all supported files and files in subfolders', function () {
    return seeder
      ._listAll({
        recursive: true,
      })
      .then(function (list) {
        expect(normalizePathArray(list)).to.eql(
          normalizePathArray([
            process.cwd() + '/test/integration/seed/1-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/1-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/1-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/1-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/1-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/1-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/1-seeds/ls-seed.ls',
            process.cwd() + '/test/integration/seed/1-seeds/ts-seed.ts',
            process.cwd() + '/test/integration/seed/2-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/2-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/2-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/2-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/2-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/2-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/2-seeds/ls-seed.ls',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/co-seed.co',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/coffee-seed.coffee',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/eg-seed.eg',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/iced-seed.iced',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/js-seed.js',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/litcoffee-seed.litcoffee',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/ls-seed.ls',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/ts-seed.ts',
            process.cwd() + '/test/integration/seed/2-seeds/ts-seed.ts',
          ])
        );
      });
  });
  it('should include all supported files and files in subfolders, sorted by directories', function () {
    return seeder
      ._listAll({
        recursive: true,
        sortDirsSeparately: true,
      })
      .then(function (list) {
        expect(normalizePathArray(list)).to.eql(
          normalizePathArray([
            process.cwd() + '/test/integration/seed/2-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/2-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/2-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/2-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/2-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/2-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/2-seeds/ls-seed.ls',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/co-seed.co',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/coffee-seed.coffee',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/eg-seed.eg',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/iced-seed.iced',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/js-seed.js',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/litcoffee-seed.litcoffee',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/ls-seed.ls',
            process.cwd() +
              '/test/integration/seed/2-seeds/recursive-folder/ts-seed.ts',
            process.cwd() + '/test/integration/seed/2-seeds/ts-seed.ts',
            process.cwd() + '/test/integration/seed/1-seeds/co-seed.co',
            process.cwd() + '/test/integration/seed/1-seeds/coffee-seed.coffee',
            process.cwd() + '/test/integration/seed/1-seeds/eg-seed.eg',
            process.cwd() + '/test/integration/seed/1-seeds/iced-seed.iced',
            process.cwd() + '/test/integration/seed/1-seeds/js-seed.js',
            process.cwd() +
              '/test/integration/seed/1-seeds/litcoffee-seed.litcoffee',
            process.cwd() + '/test/integration/seed/1-seeds/ls-seed.ls',
            process.cwd() + '/test/integration/seed/1-seeds/ts-seed.ts',
          ])
        );
      });
  });
});
