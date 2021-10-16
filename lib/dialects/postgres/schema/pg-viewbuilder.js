const ViewBuilder = require('../../../schema/viewbuilder.js');

class ViewBuilder_PG extends ViewBuilder {
  constructor() {
    super(...arguments);
  }

  withCheckOption() {
    this._single.checkOption = 'default_option';
    return this;
  }

  withLocalCheckOption() {
    this._single.checkOption = 'local';
    return this;
  }

  withCascadedCheckOption() {
    this._single.checkOption = 'cascaded';
    return this;
  }
}

module.exports = ViewBuilder_PG;
