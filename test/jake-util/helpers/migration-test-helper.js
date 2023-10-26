/* eslint-disable no-undef */

const os = require('os');
const fs = require('fs');
const child_process = require('child_process');
const rimrafSync = require('rimraf').sync;

function assertExec(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    let stderr = '';
    let stdout = '';
    const bin = child_process.exec(cmd);
    bin.on('error', (msg, code) => reject(Error(desc + ' FAIL. ' + stderr)));
    bin.on('cmdEnd', (cmd) => resolve({ cmd, stdout, stderr }));
    bin.on('stdout', (data) => (stdout += data.toString()));
    bin.on('stderr', (data) => (stderr += data.toString()));
  });
}

function assertExecError(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    let stderr = '';
    const bin = child_process.exec(cmd);
    bin.on('error', (msg, code) => {
      resolve(stderr);
    });
    bin.on('cmdEnd', () => {
      throw new Error('Error was expected, but none thrown');
    });
    bin.on('stderr', (data) => (stderr += data.toString()));
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
