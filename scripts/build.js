'use strict';
const shell = require('shelljs');
const fs = require('fs');

['tmp', 'build', 'lib'].forEach(function (dir) {
  shell.rm('-rf', dir);
  shell.mkdir(dir);
});

shell.exec('npm run babel');

shell.cp('-r', 'lib', 'tmp/lib');
shell.cp('knex.js', 'tmp');

const p = require('../package');
p.main = 'lib';
p.scripts=p.devDependencies=undefined;
fs.writeFileSync('tmp/package.json', JSON.stringify(p, null, 2));

const webpack_config = require('./webpack.config.js');
webpack_config.entry = 'tmp';
webpack_config.output = {
  path: 'build/',
  filename: 'knex.js',
};
require("webpack")(webpack_config, function (err) {
  if (err) throw err;
  shell.rm('-rf', 'tmp');
});
