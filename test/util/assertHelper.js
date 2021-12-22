const { isCockroachDB } = require('./db-helpers');
const { expect } = require('chai');
const { isObject } = require('../../lib/util/is');

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

function stringifyJsonValues(json) {
  if (Array.isArray(json)) {
    return json.map((j) => stringifyJsonValues(j));
  } else if (isObject(json)) {
    Object.keys(json).map((k, i) => {
      json[k] = stringifyJsonValues(json[k]);
    });
    return json;
  } else {
    return json !== null && json !== undefined ? json.toString() : json;
  }
}

function assertJsonEquals(jsons, jsonsExpected) {
  if (!Array.isArray(jsons)) {
    jsons = [jsons];
  }
  if (!Array.isArray(jsonsExpected)) {
    jsonsExpected = [jsonsExpected];
  }
  expect(jsons.length).to.equal(jsonsExpected.length);
  jsons.forEach((json, i) => {
    const jsonExpected = JSON.parse(
      isObject(json) ? JSON.stringify(json) : json
    );
    expect(stringifyJsonValues(jsonExpected)).to.eql(
      stringifyJsonValues(jsonsExpected[i])
    );
  });
}

module.exports = {
  assertNumber,
  assertNumberArray,
  assertNumberArrayStrict,
  normalizePath,
  normalizePathArray,
  assertJsonEquals,
};
