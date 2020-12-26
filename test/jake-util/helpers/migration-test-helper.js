/* eslint-disable no-undef */

const os = require('os');
const fs = require('fs');
const rimrafSync = require('rimraf').sync;

function assertExec(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    let stderr = '';
    let stdout = '';
    // console.log(`Executing: ${cmd}`);
    const bin = jake.createExec([cmd]);
    bin.addListener('error', (msg, code) =>
      reject(Error(desc + ' FAIL. ' + stderr))
    );
    bin.addListener('cmdEnd', (cmd) => resolve({ cmd, stdout, stderr }));
    bin.addListener('stdout', (data) => (stdout += data.toString()));
    bin.addListener('stderr', (data) => (stderr += data.toString()));
    bin.run();
  });
}

function assertExecError(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    let stderr = '';
    // console.log(`Executing: ${cmd}`);
    const bin = jake.createExec([cmd]);
    bin.addListener('error', (msg, code) => {
      resolve(stderr);
    });
    bin.addListener('cmdEnd', () => {
      throw new Error('Error was expected, but none thrown');
    });
    bin.addListener('stderr', (data) => (stderr += data.toString()));
    bin.run();
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
