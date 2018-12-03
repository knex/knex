/* eslint-disable no-undef */
/* eslint-disable no-console */

const os = require('os');
const fs = require('fs');
const rimrafSync = require('rimraf').sync;

function assertExec(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    let stderr = '';
    console.log(`Executing: ${cmd}`);
    const bin = jake.createExec([cmd]);
    bin.addListener('error', (msg, code) =>
      reject(Error(desc + ' FAIL. ' + stderr))
    );
    bin.addListener('cmdEnd', resolve);
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
        rimrafSync('test/jake/test.sqlite3');
        if (itFails) {
          process.exit(1);
        }
      });
  });
}

module.exports = {
  assertExec,
  test,
};
