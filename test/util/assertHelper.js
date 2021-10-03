const { isCockroachDB } = require('./db-helpers');
const { expect } = require('chai');

function normalizePath(pathEntry) {
  return pathEntry.replace(/\\/g, '/');
}
function normalizePathArray(pathArray) {
  return pathArray.map((pathEntry) => {
    return pathEntry.replace(/\\/g, '/');
  });
}
function assertNumberArray(knex, numberArray, expectedArray) {
  if (isCockroachDB(knex)) {
    const transformedArray = numberArray.map((entry) => {
      return parseInt(entry);
    });
    expect(transformedArray).to.have.members(expectedArray);
  } else {
    expect(numberArray).to.have.members(expectedArray);
  }
}

function assertNumberArrayStrict(knex, numberArray, expectedArray) {
  if (isCockroachDB(knex)) {
    const transformedArray = numberArray.map((entry) => {
      return parseInt(entry);
    });
    expect(transformedArray).to.deep.equal(expectedArray);
  } else {
    expect(numberArray).to.deep.equal(expectedArray);
  }
}

function assertNumber(knex, id, expectedId) {
  if (isCockroachDB(knex)) {
    const transformedId = parseInt(id);
    expect(transformedId).to.equal(expectedId);
  } else {
    expect(id).to.equal(expectedId);
  }
}

module.exports = {
  assertNumber,
  assertNumberArray,
  assertNumberArrayStrict,
  normalizePath,
  normalizePathArray,
};
