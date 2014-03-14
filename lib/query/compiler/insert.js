

    var insertVals = _.map(this._prepInsert(values), function(obj, i) {
      if (i === 0) columns = this._columnize(_.pluck(obj, 0));
      return '(' + _.pluck(obj, 1).join(', ') + ')';
    }, this);
      columns: '(' + columns + ')',
      value: insertVals.join(', ')


    // Preps the values for `insert` or `update`.
    _prepInsert: function(values) {
      var vals = _.clone(values);
      if (!_.isArray(vals)) vals = (values ? [vals] : []);

      // Allows for multi-insert objects with missing keys.
      // TODO: Decide if we really want this?
      var defaults = _.reduce(_.union.apply(_, _.map(vals, function(val) {
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