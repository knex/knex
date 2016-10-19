import Bluebird from 'bluebird'
import EventEmitter from 'events'
import queryInterface from '../mixins/queryInterface'

export default class KnexPartial extends EventEmitter {

  constructor(source) {
    super()
    this.__source = source
    this.__source.__state.toPartial()
  }

  queryBuilder() {
    return this.__source.clone()
  }

  // Query Builder Methods

  then() {
    return Bluebird.reject(new Error('Cannot coerce a partial directly to a promise.'))
  }

}

queryInterface(KnexPartial)
