"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BDRConnection = (function () {
  function BDRConnection(clientsList) {
    _classCallCheck(this, BDRConnection);

    this.clientsList = clientsList;
  }

  BDRConnection.prototype.destroy = function destroy() {};

  BDRConnection.prototype.getValidConnection = function getValidConnection() {};

  return BDRConnection;
})();

module.exports = BDRConnection;