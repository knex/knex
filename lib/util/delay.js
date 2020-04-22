/**
 * @param {number} delay
 * @returns {Promise<void>}
 */
module.exports = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay));
