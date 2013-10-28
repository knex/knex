"use strict";

module.exports = function (commands) {
  commands['migrate'] = function (argv) {

  };
  commands['migrate'].help = 'runs migrations that have not run yet'

  commands['migrate:make'] = function (argv) {

  }
  commands['migrate:make'].help = 'generates a new migration'

  commands['migrate:up'] = function (argv) {
    
  };

  commands['migrate:down'] = function (argv) {
    
  }
}
