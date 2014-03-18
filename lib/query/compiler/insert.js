module.exports = function(client) {

  var dialect = client.dialect;

  var InsertCompiler = function(builder, formatter) {
    this.builder = builder;
    this.formatter = formatter;
  };

  InsertCompiler.prototype = {

    toSql: function() {
      var insertData = this.get('insert');
      return 'insert into ' + this.tableName + ' ' +
        insertData.columns + ' values ' + insertData.value;
    },

    postgres: function() {

    },

    mysql: function() {

    },

    sqlite: function() {

    },

    prepInsert: function(values) {
      if (!_.isArray(values)) values = values ? [values] : [];
      for (var i = 0, l = values.length; i<l; i++) {
        var obj = values[i] = helpers.sortObject(values[i]);
        for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
          this.bindings.push(obj[i2][1]);
        }
      }
      return values;
    },

    insertMissing: function() {
      return
    }

    // prep
    //   var insertVals = _.map(this._prepInsert(values), function(obj, i) {
    //     if (i === 0) columns = this._columnize(_.pluck(obj, 0));
    //     return '(' + _.pluck(obj, 1).join(', ') + ')';
    //   }, this);
    //     columns: '(' + columns + ')',
    //     value: insertVals.join(', ')


    // // Preps the values for `insert` or `update`.
    // prepInsert: function(values) {
    //   var vals = _.clone(values);
    //   if (!_.isArray(vals)) vals = (values ? [vals] : []);

    //   // Allows for multi-insert objects with missing keys.
    //   // TODO: Decide if we really want this?
    //   var defaults = _.reduce(_.union.apply(_, _.map(vals, function(val) {
    //     return _.keys(val);
    //   })), function(memo, key) {
    //     memo[key] = void 0;
    //     return memo;
    //   }, {});

    //   for (var i = 0, l = vals.length; i<l; i++) {
    //     var obj = vals[i] = helpers.sortObject(_.defaults(vals[i], defaults));
    //     for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
    //       obj[i2][1] = f.parameter(obj[i2][1]);
    //     }
    //   }
    //   return vals;
    // }

  };

};