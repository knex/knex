const ViewBuilder = require('../../../schema/viewbuilder.js');

class ViewBuilder_MySQL extends ViewBuilder {
  constructor() {
    super(...arguments);
  }

  checkOption() {
    this._single.checkOption = 'default_option';
  }

  localCheckOption() {
    this._single.checkOption = 'local';
  }

  cascadedCheckOption() {
    this._single.checkOption = 'cascaded';
  }
}

module.exports = ViewBuilder_MySQL;
