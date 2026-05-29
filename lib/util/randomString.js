const numberAlphabet = '0123456789';

/**
 * Generate a numeric-only random string. This uses the non-secure,
 * predictable random generator and is intended for low-collision-sensitivity
 * uses such as generating temporary identifiers.
 *
 * @param size Length of the string. The default size is 21.
 * @returns A random numeric string.
 */
function randomNumericString(size = 21) {
  let id = '';
  let i = size;
  while (i--) {
    id += numberAlphabet[(Math.random() * 10) | 0];
  }
  return id;
}

module.exports = { randomNumericString };
