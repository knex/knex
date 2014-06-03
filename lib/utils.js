module.exports = {

  pgBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

};