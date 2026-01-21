const sinon = require('sinon');

function makeRawReturn(value) {
  return { toString: sinon.stub().returns(value) };
}

function makeKnexWithRawReturn(value) {
  const rawReturn = makeRawReturn(value);
  const raw = sinon.stub().returns(rawReturn);
  return { knex: { raw }, raw, rawReturn };
}

function makeKnexWithClient(escapeBinding) {
  const raw = sinon.stub();
  const knex = { raw, client: { _escapeBinding: escapeBinding } };
  return { knex, raw };
}

function makeEscapeBinding() {
  return sinon.stub().callsFake((value) => `<${value}>`);
}

module.exports = {
  makeKnexWithRawReturn,
  makeKnexWithClient,
  makeEscapeBinding,
};
