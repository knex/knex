'use strict';
import Raw from './raw';
import {keys} from "lodash";

class Cast extends Raw {
  constructor(client) {
    super(client);

    this.value = null;
    this.to    = '';
    this.alias = '';
  }

  cast(value, to) {
    this.value = value;
    this.to    = to;

    return this;
  }

  as(alias) {
    this.alias = alias;

    return this;
  }

  static get TYPES() {
    return {
      Text:    'text',
      Int:     'integer',
      BigInt:  'bigint',
      Float:   'float',
      Decimal: 'decimal',
      Real:    'real',
      Bool:    'boolean',
      Json:    'json',
    };
  }

  castText(value) {
    return this.cast(value, Cast.TYPES.Text);
  }

  castInt(value) {
    return this.cast(value, Cast.TYPES.Int);
  }

  castBigInt(value) {
    return this.cast(value, Cast.TYPES.BigInt);
  }

  castFloat(value) {
    return this.cast(value, Cast.TYPES.Float);
  }

  castDecimal(value) {
    return this.cast(value, Cast.TYPES.Decimal);
  }

  castReal(value) {
    return this.cast(value, Cast.TYPES.Real);
  }

  castBool(value) {
    return this.cast(value, Cast.TYPES.Bool);
  }

  castJson(value) {
    return this.cast(value, Cast.TYPES.Json);
  }

  toSQL() {
    const {value, to, alias} = this;

    const asAlias = alias ? `AS ${this.client.formatter(this).wrap(alias)}` : '';

    const cast = to === Cast.TYPES.Json
      ? `to_jsonb(?) ${asAlias}`
      : `CAST(? AS ${to}) ${asAlias}`;

    this.set(cast.trim(), [value]);

    return super.toSQL(...arguments);
  }
}

export default Cast

export function addCast(target, client = target) {
  target.cast = function() {
    const cast = new Cast(client);

    return cast.cast(...arguments);
  };

  for(const castType of keys(Cast.TYPES)) {
    const fnName = `cast${castType}`;

    target[fnName] = function() {
      const cast = new Cast(client);

      return cast[fnName](...arguments);
    };
  }
}