
export default function asyncInterface(TargetClass) {

  TargetClass.prototype.bind = function bind() {
    return this.then().bind(...arguments)
  }
  TargetClass.prototype.catch = function catch$() {
    return this.then()['catch'](...arguments)
  }
  TargetClass.prototype.finally = function finally$() {
    return this.then()['finally'](...arguments)
  }
  TargetClass.prototype.asCallback = function asCallback() {
    return this.then().asCallback(...arguments)
  }
  TargetClass.prototype.spread = function spread() {
    return this.then().spread(...arguments)
  }
  TargetClass.prototype.map = function map() {
    return this.then().map(...arguments)
  }
  TargetClass.prototype.reduce = function reduce() {
    return this.then().reduce(...arguments)
  }
  TargetClass.prototype.tap = function tap() {
    return this.then().tap(...arguments)
  }
  TargetClass.prototype.thenReturn = function thenReturn() {
    return this.then().thenReturn(...arguments)
  }
  TargetClass.prototype.return = function return$() {
    return this.then()['return'](...arguments)
  }
  TargetClass.prototype.yield = function yield$() {
    return this.then()['yield'](...arguments)
  }
  TargetClass.prototype.ensure = function ensure() {
    return this.then().ensure(...arguments)
  }
  TargetClass.prototype.reflect = function reflect() {
    return this.then().reflect(...arguments)
  }

}
