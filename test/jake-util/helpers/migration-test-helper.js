/* eslint-disable no-undef */

const os = require('os');
const fs = require('fs');
const child_process = require('child_process');
const rimrafSync = require('rimraf').sync;

function assertExec(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, (error, stdout, stderr) => {
      if (error) reject(Error(desc + ' FAIL. ' + stderr));
      else resolve({ cmd, stdout, stderr });
    });
  });
}

function assertExecError(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, (error, stdout, stderr) => {
      if (error) resolve(stderr);
      else reject(new Error('Error was expected, but none thrown'));
    });
  });
}

function test(taskList, description, func) {
  const tmpDirPath = os.tmpdir() + '/knex-test-';
  rimrafSync(tmpDirPath);
  const tempFolder = fs.mkdtempSync(tmpDirPath);
  desc(description);
  const taskName = description.replace(/[^a-z0-9]/g, '');
  taskList.push(taskName);
  task(taskName, { async: true }, () => {
    let itFails = false;
    return func(tempFolder)
      .then(() => {
        console.log('☑ ' + description);
      })
      .catch((err) => {
        console.log('☒ ' + err.message);
        itFails = true;
      })
      .then(() => {
        rimrafSync(tmpDirPath);
        rimrafSync(__dirname + '/../test.sqlite3');
        if (itFails) {
          process.exit(1);
        }
      });
  });
}

module.exports = {
  assertExec,
  assertExecError,
  test,
};
