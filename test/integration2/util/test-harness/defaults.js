// @ts-check

/** @typedef {import('./helpers').DriverName} DriverName */

const { ENUM_DRIVERS, DRIVER_NAMES, expandDriverGroups } = require('./helpers');
const { errorWithProps } = require('./helpers');

// DEFAULT_DRIVERS and DEFAULT_EXCLUSIONS below should strictly make up
// DRIVER_NAMES

const __sourceline =
  new Error().stack?.split(/\r?\n/)?.[1]?.trim() ??
  /* istanbul ignore next: defensive coding */
  `in ${__dirname}/${__filename}`;

/**
 * The list of drivers to include in default test runs
 *
 * @type {readonly DriverName[]}
 */
const DEFAULT_DRIVERS = Object.freeze([
  ENUM_DRIVERS.PostgreSQL,
  ENUM_DRIVERS.PgNative,
  ENUM_DRIVERS.MySQL,
  ENUM_DRIVERS.MySQL2,
  ENUM_DRIVERS.SQLite,
  ENUM_DRIVERS.MsSQL,
  ENUM_DRIVERS.CockroachDB,
  ENUM_DRIVERS.BetterSQLite3,
]);

/**
 * The list of drivers to exclude from default test runs
 *
 * @type {readonly DriverName[]}
 */
const DEFAULT_EXCLUSIONS = Object.freeze([
  ENUM_DRIVERS.Redshift,
  ENUM_DRIVERS.Oracle,
]);

/**
 * Assert that DEFAULT_DRIVERS and DEFAULT_EXCLUSIONS are correct
 * @param {readonly DriverName[]} defaults
 * @param {readonly DriverName[]} exclusions
 */
const assertSaneDefaults = (defaults, exclusions) => {
  // Some databases aren't included in the default integration test run, because
  // they require more difficult setup. The previous approach was to just have
  // a constant list of database clients to _include_ by default, but this means
  // that when new dialects/databases get added, the tests just won't run against
  // them unless somebody knows to go add it.
  //
  // A more useful approach is to run against everything unless explicitly opted
  // out. Since this code is part of a migration from the old approach to the
  // new approach, it is a little extra-safe by defining _both_ an inclusion
  // list (which ensures that we're running the same tests that we were running
  // before in the same invocations) _and_ an exclusion list (how we _want_ to
  // do things). It verifies that all the available clients are represented
  // in exactly one of the lists or crashes.
  const errors = [];

  // defaults + exclusions should be equal to DRIVER_NAMES
  for (const client of DRIVER_NAMES) {
    const inDefault = defaults.includes(client);
    const inExcluded = exclusions.includes(client);
    if (!inDefault && !inExcluded) {
      errors.push(`${client}: missing from both defaults and exclusions`);
    } else if (inDefault && inExcluded) {
      errors.push(`${client}: present in both defaults and exclusions`);
    }
  }

  if (errors.length > 0) {
    throw errorWithProps(
      'DB integration test setup: the default / excluded clients lists do not agree with the SUPPORTED_CLIENTS list',
      {
        errors,
        advice: `Please update the lists ${__sourceline}`,
      }
    );
  }
};

/**
 * Return the enabled drivers according to the `DB` environment variable,
 * or the default drivers if empty
 *
 * @param {string} [env]
 * @returns {readonly DriverName[]}
 */
const getEnvDrivers = (env) => {
  const envDrivers = (env ?? '')
    .trim()
    .split(/ +/)
    .filter((v) => v !== '');
  if (envDrivers.length > 0) {
    return expandDriverGroups(envDrivers);
  } else {
    return DEFAULT_DRIVERS;
  }
};

module.exports = {
  ENV_DRIVERS: getEnvDrivers(process.env['DB']),
  DEFAULT_DRIVERS,
  DEFAULT_EXCLUSIONS,
  getEnvDrivers,
  assertSaneDefaults,
};
