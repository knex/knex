'use strict';

const path = require('path');
const { execFile } = require('child_process');
const { expect } = require('chai');

/**
 * Execute _justexit.js as a child process, return a promise for its stdout/stderr
 *
 * @param {...string} args
 * @returns {Promise<{error: import('child_process').ExecException|null, stdout: string, stderr: string}>}
 */
function exec(...args) {
  return new Promise((resolve) => {
    execFile(
      'node',
      [path.resolve(__dirname, '_justexit.js'), ...args],
      (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      },
      { timeout: 1000, cwd: __dirname, env: {} }
    );
  });
}

describe('cli-config-utils exit()', () => {
  it('Prints Error contents', async () => {
    const { error, stderr } = await exec('error');
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with an Error/);
    // includes stack trace
    expect(stderr).to.match(/_justexit/);
  });
  it('Handles special formatting for KnexfileRuntimeError (error source)', async () => {
    const { error, stderr } = await exec('knexfile-error-1');
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with a KnexfileRuntimeError/);
    // includes detail
    expect(stderr).to.match(/source error/);
    // includes stack trace
    expect(stderr).to.match(/_justexit/);
  });
  it('Handles special formatting for KnexfileRuntimeError (non-error source)', async () => {
    const { error, stderr } = await exec('knexfile-error-2');
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with a KnexfileRuntimeError/);
    // includes detail
    expect(stderr).to.match(/config\/path/);
    expect(stderr).to.match(/some.*object/s);
    // does not include stack trace
    expect(stderr).not.to.match(/_justexit/);
  });
  it('Prints string contents', async () => {
    const { error, stderr } = await exec('string');
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with a string/);
    // does NOT include stack trace
    expect(stderr).not.to.match(/_justexit/);
  });
  it('Prints stringable contents', async () => {
    const { error, stderr } = await exec('stringable');
    expect(error.code).to.eq(1);
    // includes stringified value
    expect(stderr).to.match(/\{.*called exit with an object.*}/s);
    // does NOT include stack trace
    expect(stderr).not.to.match(/_justexit/);
  });
  it('Prints non-stringable contents', async () => {
    const { error, stderr } = await exec('non-stringable');
    expect(error.code).to.eq(1);
    // includes stringified value
    expect(stderr).to.match(/Object: null prototype/);
    expect(stderr).to.match(/\{.*called exit with a null-prototype object.*}/s);
  });
});
