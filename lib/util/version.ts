/** Tuple of three non-negative integers representing a semantic version */
export type Version = [number, number, number];

/** Helper function to check `x` a integer where `x >= 0`  */
export function isNonNegInt(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0;
}

/** Type-guard for `Version` type */
export function isVersion(x: unknown): x is Version {
  return (
    Array.isArray(x) &&
    x.length === 3 &&
    x.findIndex((y) => !isNonNegInt(y)) === -1
  );
}

/** Parses given string into `Version` or returns `undefined` */
export function parseVersion(x: string): Version | undefined {
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)/m;
  const versionNumbers = (versionRegex.exec(x) ?? [])
    .slice(1, 4)
    .map((x) => parseInt(x));
  if (!isVersion(versionNumbers)) return undefined;
  return versionNumbers;
}

/** Parses given string into `Version` or throws an error */
export function parseVersionOrError(x: string): Version {
  const version = parseVersion(x);
  if (version === undefined) {
    throw new Error('Could not parse string to Version');
  }
  return version;
}

/**
 * Compares two versions, returning a number to represent the result:
 *
 * - `1` means `v1 > v2`
 * - `0` means `v1 == v2`
 * - `-1` means `v1 < v2`
 */
export function compareVersions(v1: Version, v2: Version): 1 | 0 | -1 {
  // Check major
  if (v1[0] < v2[0]) return -1;
  else if (v1[0] > v2[0]) return 1;
  else {
    // Check minor
    if (v1[1] < v2[1]) return -1;
    else if (v1[1] > v2[1]) return 1;
    else {
      // Check patch
      if (v1[2] < v2[2]) return -1;
      else if (v1[2] > v2[2]) return 1;
      else return 0;
    }
  }
}

/**
 * Returns `boolean` for if a given `version` satisfies the given `min` (inclusive) and `max` (exclusive).
 *
 * This will throw an error if:
 *
 * - Given `version` is NOT a valid `Version`
 * - Neither `min` nor `max` is given
 * - `min` is given but is NOT a valid `Version`
 * - `max` is given but is NOT a valid `Version`
 */
export function satisfiesVersion(
  version: Version,
  min?: Version,
  max?: Version
): boolean {
  if (!min && !max) {
    throw new Error('Must pass at least one version constraint');
  }
  if (!isVersion(version)) {
    throw new Error('Invalid value given for: version');
  }

  // Check Min
  let satisfiesMin = true;
  if (min) {
    if (!isVersion(min)) {
      throw new Error('Invalid value given for: min');
    }
    satisfiesMin = compareVersions(version, min) > -1;
  }

  // Check max
  let satisfiesMax = true;
  if (max) {
    if (!isVersion(max)) {
      throw new Error('Invalid value given for: max');
    }
    satisfiesMax = compareVersions(version, max) === -1;
  }

  return satisfiesMin && satisfiesMax;
}
