
export default class KnexBuilderState {

  constructor(log) {
    this.log = log
    this.method = 'select'
    this.single = {};
    this.statements = {};
    this.options = [];
    this.debug = false

    // Internal flags used in the builder.
    this.joinFlag = 'inner';
    this.boolFlag = 'and';
    this.notFlag = false;

    // Whether the building chain using the state
    // has been marked explicitly ".asPartial"
    this.markedAsPartial = false

    // Whether we've called .then on the associated builder chain
    this.coercedToPromise = false
  }

  set(key, val) {
    if (!this.hasOwnProperty(key)) {
      throw new Error(`Cannot set invalid key ${key} on KnexBuilderState`)
    }
    check(this, () => {
      this[key] = val
    })
  }

  setSingle(key, val) {
    if (this.single.hasOwnProperty(key)) {
      this.log.warn(`Reassigning value ${key} in the query builder`)
    }
    check(this, () => {
      this.single[key] = val
    })
  }

  addStatement(grouping, obj) {
    check(this, () => {
      this.statements[grouping] = (this.statements[grouping] || []).concat(obj)
    })
  }

  clone() {
    const state = new this.constructor(this.log)
    state.method = this.method
    state.single = Object.assign({}, this.single)
    state.statements = Object.assign({}, this.statements)
    state.options = this.options.slice()
    state.debug = this.debug
    state.joinFlag = this.joinFlag
    state.boolFlag = this.boolFlag
    state.notFlag = this.notFlag
    return state
  }

  toJSON() {
    const {method, statements, single, options, debug} = this
    return {
      method, statements, single, options, debug
    }
  }

  toPartial() {
    if (this.coercedToPromise) {
      throw new Error('Cannot create a partial chain from a query which has already been executed.')
    }
    if (this.markedAsPartial) {
      this.log.warn('.asPartial called multiple times (unnecessarily) on the query builder')
    }
    this.markedAsPartial = true
  }

  toPromise() {
    this.coercedToPromise = true
  }

}

function check(state, fn) {
  if (state.markedAsPartial || state.coercedToPromise) {
    let msg
    if (state.markedAsPartial) msg = 'Cannot mutate a query chain marked as an .asPartial base'
    if (state.coercedToPromise) msg = 'Cannot mutate a query chain already executed as a promise'
    throw new Error(msg)
  } else {
    fn()
  }
}
