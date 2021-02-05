function normalizePath(pathEntry) {
  return pathEntry.replace(/\\/g, '/');
}
function normalizePathArray(pathArray) {
  return pathArray.map((pathEntry) => {
    return pathEntry.replace(/\\/g, '/');
  });
}

module.exports = {
  normalizePath,
  normalizePathArray,
};
