function isNode6() {
  return (
    process &&
    process.versions &&
    process.versions.node &&
    process.versions.node.startsWith('6.')
  );
}

module.exports = {
  isNode6,
};
