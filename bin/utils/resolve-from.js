function silent(fromDirectory, moduleId) {
  try {
    return require.resolve(moduleId, { paths: [fromDirectory] })
  } catch (e) {
    return '';
  }
}

module.exports = { silent };
