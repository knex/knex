const ViewBuilder = require('../../../schema/viewbuilder.js');

class ViewBuilder_MySQL extends ViewBuilder {
  constructor() {
    super(...arguments);
  }

  withCheckOption() {
    this._single.checkOption = 'default_option';
  }

  withLocalCheckOption() {
    this._single.checkOption = 'local';
  }

  withCascadedCheckOption() {
    this._single.checkOption = 'cascaded';
  }
}

module.exports = ViewBuilder_MySQL;
