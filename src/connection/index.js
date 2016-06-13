import { EventEmitter } from 'events'

export default class Connection extends EventEmitter {

  constructor(connection) {
    super()
    this.connection = connection

    // Flag indicating whether the connection is "managed",
    // and should be released to the pool upon completion
    this.managed = false
  }

  execute() {
    return this._execute()
  }



}

