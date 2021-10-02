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
function assertIdArray(knex, idArray, expectedArray) {
  if (isCockroachDB(knex)) {
    const transformedArray = idArray.map((entry) => {
      return parseInt(entry);
    });
    expect(transformedArray).to.deep.equal(expectedArray);
  } else {
    expect(idArray).to.deep.equal(expectedArray);
  }
}

function assertId(knex, id, expectedId) {
  if (isCockroachDB(knex)) {
    const transformedId = parseInt(id);
    expect(transformedId).to.equal(expectedId);
  } else {
    expect(id).to.equal(expectedId);
  }
}

module.exports = {
  assertId,
  assertIdArray,
  normalizePath,
  normalizePathArray,
};
