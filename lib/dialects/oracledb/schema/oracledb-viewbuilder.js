const ViewBuilder = require('../../../schema/viewbuilder.js');

class ViewBuilder_Oracledb extends ViewBuilder {
  constructor() {
    super(...arguments);
  }

  checkOption() {
    this._single.checkOption = 'default_option';
  }
}

module.exports = ViewBuilder_Oracledb;
