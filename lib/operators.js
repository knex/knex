const { transform } = require('lodash');

// Turn this into a lookup map
exports.operators = transform(
    [
      '=',
      '<',
      '>',
      '<=',
      '>=',
      '<>',
      '!=',
      'like',
      'not like',
      'between',
      'not between',
      'ilike',
      'not ilike',
      'exists',
      'not exist',
      'rlike',
      'not rlike',
      'regexp',
      'not regexp',
      '&',
      '|',
      '^',
      '<<',
      '>>',
      '~',
      '~*',
      '!~',
      '!~*',
      '#',
      '&&',
      '@>',
      '<@',
      '||',
      '&<',
      '&>',
      '-|-',
      '@@',
      '!!',
      ['?', '\\?'],
      ['?|', '\\?|'],
      ['?&', '\\?&'],
    ],
    (result, key) => {
      if (Array.isArray(key)) {
        result[key[0]] = key[1];
      } else {
        result[key] = key;
      }
    },
    {}
  );