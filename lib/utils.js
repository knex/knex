module.exports = {

  // If we are running an insert with variable object keys, we need to normalize
  // for the missing keys, presumably setting the values to undefined.
  prepInsert: function(data) {
    return _.reduce(_.union.apply(_, _.map(data, function(val) {
      return _.keys(val);
    })), function(memo, key) {
      memo[key] = void 0;
      return memo;
    }, {});
  },

  pgBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

};