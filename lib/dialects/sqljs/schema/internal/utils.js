function isEqualId(first, second) {
  return first.toLowerCase() === second.toLowerCase();
}

function includesId(list, id) {
  return list.some((item) => isEqualId(item, id));
}

module.exports = {
  isEqualId,
  includesId,
};
