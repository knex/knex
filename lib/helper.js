module.exports = {

  // If we are running an insert with variable object keys, we need to normalize
  // for the missing keys, presumably setting the values to undefined.
  prepInsert: function(data) {
    var defaults = _.reduce(_.union.apply(_, _.map(data, function(val) {
      return _.keys(val);
    })), function(memo, key) {
      memo[key] = void 0;
      return memo;
    }, {});
    for (var i = 0, l = vals.length; i<l; i++) {
      var obj = vals[i] = helpers.sortObject(_.defaults(vals[i], defaults));
      for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
        obj[i2][1] = f.parameter(obj[i2][1]);
      }
    }
    return vals;
  },

  pgBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

};