
// Raw
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _events = require('events');

var _lodash = require('lodash');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function Raw(client) {
  this.client = client;

  this.sql = '';
  this.bindings = [];
  this._cached = undefined;

  // Todo: Deprecate
  this._wrappedBefore = undefined;
  this._wrappedAfter = undefined;
  this._debug = client && client.config && client.config.debug;
}
_inherits2['default'](Raw, _events.EventEmitter);

_lodash.assign(Raw.prototype, {

  set: function set(sql, bindings) {
    this._cached = undefined;
    this.sql = sql;
    this.bindings = _lodash.isObject(bindings) && !bindings.toSQL || _lodash.isUndefined(bindings) ? bindings : [bindings];

    return this;
  },

  timeout: function timeout(ms) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var cancel = _ref.cancel;

    if (_lodash.isNumber(ms) && ms > 0) {
      this._timeout = ms;
      if (cancel) {
        this.client.assertCanCancelQuery();
        this._cancelOnTimeout = true;
      }
    }
    return this;
  },

  // Wraps the current sql with `before` and `after`.
  wrap: function wrap(before, after) {
    this._cached = undefined;
    this._wrappedBefore = before;
    this._wrappedAfter = after;
    return this;
  },

  // Calls `toString` on the Knex object.
  toString: function toString() {
    return this.toQuery();
  },

  // Returns the raw sql for the query.
  toSQL: function toSQL(method, tz) {
    if (this._cached) return this._cached;
    if (Array.isArray(this.bindings)) {
      this._cached = replaceRawArrBindings(this);
    } else if (this.bindings && _lodash.isPlainObject(this.bindings)) {
      this._cached = replaceKeyBindings(this);
    } else {
      this._cached = {
        method: 'raw',
        sql: this.sql,
        bindings: _lodash.isUndefined(this.bindings) ? void 0 : [this.bindings]
      };
    }
    if (this._wrappedBefore) {
      this._cached.sql = this._wrappedBefore + this._cached.sql;
    }
    if (this._wrappedAfter) {
      this._cached.sql = this._cached.sql + this._wrappedAfter;
    }
    this._cached.options = _lodash.reduce(this._options, _lodash.assign, {});
    if (this._timeout) {
      this._cached.timeout = this._timeout;
      if (this._cancelOnTimeout) {
        this._cached.cancelOnTimeout = this._cancelOnTimeout;
      }
    }
    if (this.client && this.client.prepBindings) {
      this._cached.bindings = this._cached.bindings || [];
      if (helpers.containsUndefined(this._cached.bindings)) {
        throw new Error('Undefined binding(s) detected when compiling RAW query: ' + this._cached.sql);
      }
      this._cached.bindings = this.client.prepBindings(this._cached.bindings, tz);
    }
    this._cached.__knexQueryUid = _nodeUuid2['default'].v4();
    return this._cached;
  }

});

function replaceRawArrBindings(raw) {
  var expectedBindings = raw.bindings.length;
  var values = raw.bindings;
  var client = raw.client;

  var index = 0;
  var bindings = [];

  var sql = raw.sql.replace(/\\?\?\??/g, function (match) {
    if (match === '\\?') {
      return match;
    }

    var value = values[index++];

    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      bindings = bindings.concat(bindingSQL.bindings);
      return bindingSQL.sql;
    }

    if (match === '??') {
      return client.formatter().columnize(value);
    }
    bindings.push(value);
    return '?';
  });

  if (expectedBindings !== index) {
    throw new Error('Expected ' + expectedBindings + ' bindings, saw ' + index);
  }

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

function replaceKeyBindings(raw) {
  var values = raw.bindings;
  var client = raw.client;
  var sql = raw.sql;var bindings = [];

  var regex = new RegExp(/\\?(:\w+:?)/, 'g');
  sql = raw.sql.replace(regex, function (full, part) {
    if (full !== part) {
      return part;
    }

    var key = full.trim();
    var isIdentifier = key[key.length - 1] === ':';
    var value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)];
    if (value === undefined) {
      bindings.push(value);
      return full;
    }
    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      bindings = bindings.concat(bindingSQL.bindings);
      return full.replace(key, bindingSQL.sql);
    }
    if (isIdentifier) {
      return full.replace(key, client.formatter().columnize(value));
    }
    bindings.push(value);
    return full.replace(key, '?');
  });

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

exports['default'] = Raw;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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S0FBSyxLQUFLLFNBQVMsRUFBRTtBQUN2QixjQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7QUFDRCxRQUFJLEtBQUssSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO0FBQzlDLFVBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUNoQyxjQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDL0MsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDekM7QUFDRCxRQUFJLFlBQVksRUFBRTtBQUNoQixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtLQUM5RDtBQUNELFlBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDcEIsV0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtHQUM5QixDQUFDLENBQUE7O0FBRUYsU0FBTztBQUNMLFVBQU0sRUFBRSxLQUFLO0FBQ2IsT0FBRyxFQUFILEdBQUc7QUFDSCxZQUFRLEVBQVIsUUFBUTtHQUNULENBQUE7Q0FDRjs7OztBQUlELE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7cUJBRVosR0FBRyIsImZpbGUiOiJyYXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIFJhd1xuLy8gLS0tLS0tLVxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5cbmltcG9ydCB7IGFzc2lnbiwgcmVkdWNlLCBpc1BsYWluT2JqZWN0LCBpc09iamVjdCwgaXNVbmRlZmluZWQsIGlzTnVtYmVyIH0gZnJvbSAnbG9kYXNoJ1xuXG5pbXBvcnQgdXVpZCBmcm9tICdub2RlLXV1aWQnO1xuXG5mdW5jdGlvbiBSYXcoY2xpZW50KSB7XG4gIHRoaXMuY2xpZW50ID0gY2xpZW50XG5cbiAgdGhpcy5zcWwgPSAnJ1xuICB0aGlzLmJpbmRpbmdzID0gW11cbiAgdGhpcy5fY2FjaGVkID0gdW5kZWZpbmVkXG5cbiAgLy8gVG9kbzogRGVwcmVjYXRlXG4gIHRoaXMuX3dyYXBwZWRCZWZvcmUgPSB1bmRlZmluZWRcbiAgdGhpcy5fd3JhcHBlZEFmdGVyID0gdW5kZWZpbmVkXG4gIHRoaXMuX2RlYnVnID0gY2xpZW50ICYmIGNsaWVudC5jb25maWcgJiYgY2xpZW50LmNvbmZpZy5kZWJ1Z1xufVxuaW5oZXJpdHMoUmF3LCBFdmVudEVtaXR0ZXIpXG5cbmFzc2lnbihSYXcucHJvdG90eXBlLCB7XG5cbiAgc2V0KHNxbCwgYmluZGluZ3MpIHtcbiAgICB0aGlzLl9jYWNoZWQgPSB1bmRlZmluZWRcbiAgICB0aGlzLnNxbCA9IHNxbFxuICAgIHRoaXMuYmluZGluZ3MgPSAoXG4gICAgICAoaXNPYmplY3QoYmluZGluZ3MpICYmICFiaW5kaW5ncy50b1NRTCkgfHxcbiAgICAgIGlzVW5kZWZpbmVkKGJpbmRpbmdzKVxuICAgICkgPyBiaW5kaW5ncyA6IFtiaW5kaW5nc11cblxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgdGltZW91dChtcywge2NhbmNlbH0gPSB7fSkge1xuICAgIGlmKGlzTnVtYmVyKG1zKSAmJiBtcyA+IDApIHtcbiAgICAgIHRoaXMuX3RpbWVvdXQgPSBtcztcbiAgICAgIGlmIChjYW5jZWwpIHtcbiAgICAgICAgdGhpcy5jbGllbnQuYXNzZXJ0Q2FuQ2FuY2VsUXVlcnkoKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsT25UaW1lb3V0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gV3JhcHMgdGhlIGN1cnJlbnQgc3FsIHdpdGggYGJlZm9yZWAgYW5kIGBhZnRlcmAuXG4gIHdyYXAoYmVmb3JlLCBhZnRlcikge1xuICAgIHRoaXMuX2NhY2hlZCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuX3dyYXBwZWRCZWZvcmUgPSBiZWZvcmVcbiAgICB0aGlzLl93cmFwcGVkQWZ0ZXIgPSBhZnRlclxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLy8gQ2FsbHMgYHRvU3RyaW5nYCBvbiB0aGUgS25leCBvYmplY3QuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnRvUXVlcnkoKVxuICB9LFxuXG4gIC8vIFJldHVybnMgdGhlIHJhdyBzcWwgZm9yIHRoZSBxdWVyeS5cbiAgdG9TUUwobWV0aG9kLCB0eikge1xuICAgIGlmICh0aGlzLl9jYWNoZWQpIHJldHVybiB0aGlzLl9jYWNoZWRcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmJpbmRpbmdzKSkge1xuICAgICAgdGhpcy5fY2FjaGVkID0gcmVwbGFjZVJhd0FyckJpbmRpbmdzKHRoaXMpXG4gICAgfSBlbHNlIGlmICh0aGlzLmJpbmRpbmdzICYmIGlzUGxhaW5PYmplY3QodGhpcy5iaW5kaW5ncykpIHtcbiAgICAgIHRoaXMuX2NhY2hlZCA9IHJlcGxhY2VLZXlCaW5kaW5ncyh0aGlzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jYWNoZWQgPSB7XG4gICAgICAgIG1ldGhvZDogJ3JhdycsXG4gICAgICAgIHNxbDogdGhpcy5zcWwsXG4gICAgICAgIGJpbmRpbmdzOiBpc1VuZGVmaW5lZCh0aGlzLmJpbmRpbmdzKSA/IHZvaWQgMCA6IFt0aGlzLmJpbmRpbmdzXVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fd3JhcHBlZEJlZm9yZSkge1xuICAgICAgdGhpcy5fY2FjaGVkLnNxbCA9IHRoaXMuX3dyYXBwZWRCZWZvcmUgKyB0aGlzLl9jYWNoZWQuc3FsXG4gICAgfVxuICAgIGlmICh0aGlzLl93cmFwcGVkQWZ0ZXIpIHtcbiAgICAgIHRoaXMuX2NhY2hlZC5zcWwgPSB0aGlzLl9jYWNoZWQuc3FsICsgdGhpcy5fd3JhcHBlZEFmdGVyXG4gICAgfVxuICAgIHRoaXMuX2NhY2hlZC5vcHRpb25zID0gcmVkdWNlKHRoaXMuX29wdGlvbnMsIGFzc2lnbiwge30pXG4gICAgaWYodGhpcy5fdGltZW91dCkge1xuICAgICAgdGhpcy5fY2FjaGVkLnRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICAgICAgaWYgKHRoaXMuX2NhbmNlbE9uVGltZW91dCkge1xuICAgICAgICB0aGlzLl9jYWNoZWQuY2FuY2VsT25UaW1lb3V0ID0gdGhpcy5fY2FuY2VsT25UaW1lb3V0O1xuICAgICAgfVxuICAgIH1cbiAgICBpZih0aGlzLmNsaWVudCAmJiB0aGlzLmNsaWVudC5wcmVwQmluZGluZ3MpIHtcbiAgICAgIHRoaXMuX2NhY2hlZC5iaW5kaW5ncyA9IHRoaXMuX2NhY2hlZC5iaW5kaW5ncyB8fCBbXTtcbiAgICAgIGlmKGhlbHBlcnMuY29udGFpbnNVbmRlZmluZWQodGhpcy5fY2FjaGVkLmJpbmRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFVuZGVmaW5lZCBiaW5kaW5nKHMpIGRldGVjdGVkIHdoZW4gY29tcGlsaW5nIFJBVyBxdWVyeTogYCArXG4gICAgICAgICAgdGhpcy5fY2FjaGVkLnNxbFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2FjaGVkLmJpbmRpbmdzID0gdGhpcy5jbGllbnQucHJlcEJpbmRpbmdzKHRoaXMuX2NhY2hlZC5iaW5kaW5ncywgdHopO1xuICAgIH1cbiAgICB0aGlzLl9jYWNoZWQuX19rbmV4UXVlcnlVaWQgPSB1dWlkLnY0KCk7XG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFxuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIHJlcGxhY2VSYXdBcnJCaW5kaW5ncyhyYXcpIHtcbiAgY29uc3QgZXhwZWN0ZWRCaW5kaW5ncyA9IHJhdy5iaW5kaW5ncy5sZW5ndGhcbiAgY29uc3QgdmFsdWVzID0gcmF3LmJpbmRpbmdzXG4gIGNvbnN0IHsgY2xpZW50IH0gPSByYXdcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGJpbmRpbmdzID0gW11cblxuICBjb25zdCBzcWwgPSByYXcuc3FsLnJlcGxhY2UoL1xcXFw/XFw/XFw/Py9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmIChtYXRjaCA9PT0gJ1xcXFw/Jykge1xuICAgICAgcmV0dXJuIG1hdGNoXG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaW5kZXgrK11cblxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudG9TUUwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdTUUwgPSB2YWx1ZS50b1NRTCgpXG4gICAgICBiaW5kaW5ncyA9IGJpbmRpbmdzLmNvbmNhdChiaW5kaW5nU1FMLmJpbmRpbmdzKVxuICAgICAgcmV0dXJuIGJpbmRpbmdTUUwuc3FsXG4gICAgfVxuXG4gICAgaWYgKG1hdGNoID09PSAnPz8nKSB7XG4gICAgICByZXR1cm4gY2xpZW50LmZvcm1hdHRlcigpLmNvbHVtbml6ZSh2YWx1ZSlcbiAgICB9XG4gICAgYmluZGluZ3MucHVzaCh2YWx1ZSlcbiAgICByZXR1cm4gJz8nXG4gIH0pXG5cbiAgaWYgKGV4cGVjdGVkQmluZGluZ3MgIT09IGluZGV4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAke2V4cGVjdGVkQmluZGluZ3N9IGJpbmRpbmdzLCBzYXcgJHtpbmRleH1gKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBtZXRob2Q6ICdyYXcnLFxuICAgIHNxbCxcbiAgICBiaW5kaW5nc1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VLZXlCaW5kaW5ncyhyYXcpIHtcbiAgY29uc3QgdmFsdWVzID0gcmF3LmJpbmRpbmdzXG4gIGNvbnN0IHsgY2xpZW50IH0gPSByYXdcbiAgbGV0IHsgc3FsIH0gPSByYXcsIGJpbmRpbmdzID0gW11cblxuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoL1xcXFw/KDpcXHcrOj8pLywgJ2cnKVxuICBzcWwgPSByYXcuc3FsLnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKGZ1bGwsIHBhcnQpIHtcbiAgICBpZiAoZnVsbCAhPT0gcGFydCkge1xuICAgICAgcmV0dXJuIHBhcnRcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBmdWxsLnRyaW0oKTtcbiAgICBjb25zdCBpc0lkZW50aWZpZXIgPSBrZXlba2V5Lmxlbmd0aCAtIDFdID09PSAnOidcbiAgICBjb25zdCB2YWx1ZSA9IGlzSWRlbnRpZmllciA/IHZhbHVlc1trZXkuc2xpY2UoMSwgLTEpXSA6IHZhbHVlc1trZXkuc2xpY2UoMSldXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGJpbmRpbmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIGZ1bGw7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudG9TUUwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdTUUwgPSB2YWx1ZS50b1NRTCgpXG4gICAgICBiaW5kaW5ncyA9IGJpbmRpbmdzLmNvbmNhdChiaW5kaW5nU1FMLmJpbmRpbmdzKVxuICAgICAgcmV0dXJuIGZ1bGwucmVwbGFjZShrZXksIGJpbmRpbmdTUUwuc3FsKVxuICAgIH1cbiAgICBpZiAoaXNJZGVudGlmaWVyKSB7XG4gICAgICByZXR1cm4gZnVsbC5yZXBsYWNlKGtleSwgY2xpZW50LmZvcm1hdHRlcigpLmNvbHVtbml6ZSh2YWx1ZSkpXG4gICAgfVxuICAgIGJpbmRpbmdzLnB1c2godmFsdWUpXG4gICAgcmV0dXJuIGZ1bGwucmVwbGFjZShrZXksICc/JylcbiAgfSlcblxuICByZXR1cm4ge1xuICAgIG1ldGhvZDogJ3JhdycsXG4gICAgc3FsLFxuICAgIGJpbmRpbmdzXG4gIH1cbn1cblxuLy8gQWxsb3cgdGhlIGBSYXdgIG9iamVjdCB0byBiZSB1dGlsaXplZCB3aXRoIGZ1bGwgYWNjZXNzIHRvIHRoZSByZWxldmFudFxuLy8gcHJvbWlzZSBBUEkuXG5yZXF1aXJlKCcuL2ludGVyZmFjZScpKFJhdylcblxuZXhwb3J0IGRlZmF1bHQgUmF3XG4iXX0=