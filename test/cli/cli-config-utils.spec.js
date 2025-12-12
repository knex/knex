'use strict';

const path = require('path');
const { exec: execCB } = require('child_process');
const { expect } = require('chai');

const EXIT = path.normalize(__dirname + '/_justexit.js');

/**
 * Execute a command, return a promise for its stdout/stderr
 *
 * @param {string} cmd
 * @returns {Promise<{error: import('child_process').ExecException|null, stdout: string, stderr: string}>}
 */
function exec(cmd) {
  return new Promise((resolve) => {
    execCB(
      cmd,
      (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      },
      { timeout: 1000 }
    );
  });
}

describe('cli-config-utils exit()', () => {
  it('Prints Error contents', async () => {
    const { error, stderr } = await exec(`node ${EXIT} error`);
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with an Error/);
    // includes stack trace
    expect(stderr).to.match(/_justexit/);
  });
  it('Handles special formatting for KnexfileRuntimeError (error source)', async () => {
    const { error, stderr } = await exec(`node ${EXIT} knexfile-error-1`);
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with a KnexfileRuntimeError/);
    // includes detail
    expect(stderr).to.match(/source error/);
    // includes stack trace
    expect(stderr).to.match(/_justexit/);
  });
  it('Handles special formatting for KnexfileRuntimeError (non-error source)', async () => {
    const { error, stderr } = await exec(`node ${EXIT} knexfile-error-2`);
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
    const { error, stderr } = await exec(`node ${EXIT} string`);
    expect(error.code).to.eq(1);
    // includes error message
    expect(stderr).to.match(/called exit with a string/);
    // does NOT include stack trace
    expect(stderr).not.to.match(/_justexit/);
  });
  it('Prints stringable contents', async () => {
    const { error, stderr } = await exec(`node ${EXIT} stringable`);
    expect(error.code).to.eq(1);
    // includes stringified value
    expect(stderr).to.match(/\{.*called exit with an object.*}/s);
    // does NOT include stack trace
    expect(stderr).not.to.match(/_justexit/);
  });
  it('Prints non-stringable contents', async () => {
    const { error, stderr } = await exec(`node ${EXIT} non-stringable`);
    expect(error.code).to.eq(1);
    // includes stringified value
    expect(stderr).to.match(/Object: null prototype/);
    expect(stderr).to.match(/\{.*called exit with a null-prototype object.*}/s);
  });
});
