/* eslint no-var:0 */

/**
 * Object#toString reference.
 */
var objToString = Object.prototype.toString;

/**
 * Check if a value is an array.
 *
 * @api private
 * @param {*} val The value to test.
 * @return {boolean} true if the value is an array, otherwise false.
 */
function isArray(val) {
  return objToString.call(val) === '[object Array]';
}

/**
 * Add a listener.
 *
 * @api public
 * @param {string} name Event name.
 * @param {Function} fn Event handler.
 * @return {EventEmitter} Emitter instance.
 */
function hook(name, fn) {
  if (!this.$hooks) {
    this.$hooks = {};
  }

  if (!this.$hooks[name]) {
    this.$hooks[name] = fn;
  } else if (isArray(this.$hooks[name])) {
    this.$hooks[name].push(fn);
  } else {
    this.$hooks[name] = [this.$hooks[name], fn];
  }

  return this;
}

/**
 * Adds a volatile listener.
 *
 * @api public
 * @param {string} name Event name.
 * @param {Function} fn Event handler.
 * @return {EventEmitter} Emitter instance.
 */
function hookOnce(name, fn) {
  var self = this;

  function on() {
    self.removeHook(name, on);
    fn.apply(this, arguments);
  }

  on.listener = fn;
  this.hook(name, on);

  return this;
}

/**
 * Remove a listener.
 *
 * @api public
 * @param {string} name Event name.
 * @param {Function} fn Event handler.
 * @return {EventEmitter} Emitter instance.
 */
function removeHook(name, fn) {
  if (this.$hooks && this.$hooks[name]) {
    var list = this.$hooks[name];

    if (isArray(list)) {
      var pos = -1;

      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
          pos = i;
          break;
        }
      }

      if (pos < 0) {
        return this;
      }

      list.splice(pos, 1);

      if (!list.length) {
        delete this.$hooks[name];
      }
    } else if (list === fn || (list.listener && list.listener === fn)) {
      delete this.$hooks[name];
    }
  }

  return this;
}

/**
 * Remove all listeners for an event.
 *
 * @api public
 * @param {string} name Event name.
 * @return {EventEmitter} Emitter instance.
 */
function removeAllListeners(name) {
  if (name === undefined) {
    this.$hooks = {};
    return this;
  }

  if (this.$hooks && this.$hooks[name]) {
    this.$hooks[name] = null;
  }

  return this;
}

/**
 * Get all listeners for a given event.
 *
 * @api public
 * @param {string} name Event name.
 * @return {EventEmitter} Emitter instance.
 */
function listeners(name) {
  if (!this.$hooks) {
    this.$hooks = {};
  }

  if (!this.$hooks[name]) {
    this.$hooks[name] = [];
  }

  if (!isArray(this.$hooks[name])) {
    this.$hooks[name] = [this.$hooks[name]];
  }

  return this.$hooks[name];
}

/**
 * Emit an event.
 *
 * @api public
 * @param {string} name Event name.
 * @return {boolean} true if at least one handler was invoked, else false.
 */
function emit(name) {
  if (!this.$hooks) {
    return false;
  }

  var handler = this.$hooks[name];

  if (!handler) {
    return false;
  }

  var args = Array.prototype.slice.call(arguments, 1);

  if (typeof handler === 'function') {
    handler.apply(this, args);
  } else if (isArray(handler)) {
    var listeners = handler.slice();

    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
  } else {
    return false;
  }

  return true;
}

export default {
  hook,
  hookOnce,
  removeHook,
  removeAllListeners,
  listeners,
  emit,
}
