// Sequence parser combinator
function s(sequence, post = (v) => v) {
  return function ({ index = 0, input }) {
    let position = index;
    const ast = [];

    for (const parser of sequence) {
      const result = parser({ index: position, input });

      if (result.success) {
        position = result.index;
        ast.push(result.ast);
      } else {
        return result;
      }
    }

    return { success: true, ast: post(ast), index: position, input };
  };
}

// Alternative parser combinator
function a(alternative, post = (v) => v) {
  return function ({ index = 0, input }) {
    for (const parser of alternative) {
      const result = parser({ index, input });

      if (result.success) {
        return {
          success: true,
          ast: post(result.ast),
          index: result.index,
          input,
        };
      }
    }

    return { success: false, ast: null, index, input };
  };
}

// Many parser combinator
function m(many, post = (v) => v) {
  return function ({ index = 0, input }) {
    let result = {};
    let position = index;
    const ast = [];

    do {
      result = many({ index: position, input });

      if (result.success) {
        position = result.index;
        ast.push(result.ast);
      }
    } while (result.success);

    if (ast.length > 0) {
      return { success: true, ast: post(ast), index: position, input };
    } else {
      return { success: false, ast: null, index: position, input };
    }
  };
}

// Optional parser combinator
function o(optional, post = (v) => v) {
  return function ({ index = 0, input }) {
    const result = optional({ index, input });

    if (result.success) {
      return {
        success: true,
        ast: post(result.ast),
        index: result.index,
        input,
      };
    } else {
      return { success: true, ast: post(null), index, input };
    }
  };
}

// Lookahead parser combinator
function l(lookahead, post = (v) => v) {
  return function ({ index = 0, input }) {
    const result = lookahead.do({ index, input });

    if (result.success) {
      const resultNext = lookahead.next({ index: result.index, input });

      if (resultNext.success) {
        return {
          success: true,
          ast: post(result.ast),
          index: result.index,
          input,
        };
      }
    }

    return { success: false, ast: null, index, input };
  };
}

// Negative parser combinator
function n(negative, post = (v) => v) {
  return function ({ index = 0, input }) {
    const result = negative.do({ index, input });

    if (result.success) {
      const resultNot = negative.not({ index, input });

      if (!resultNot.success) {
        return {
          success: true,
          ast: post(result.ast),
          index: result.index,
          input,
        };
      }
    }

    return { success: false, ast: null, index, input };
  };
}

// Token parser combinator
function t(token, post = (v) => v.text) {
  return function ({ index = 0, input }) {
    const result = input[index];

    if (
      result !== undefined &&
      (token.type === undefined || token.type === result.type) &&
      (token.text === undefined ||
        token.text.toUpperCase() === result.text.toUpperCase())
    ) {
      return {
        success: true,
        ast: post(result),
        index: index + 1,
        input,
      };
    } else {
      return { success: false, ast: null, index, input };
    }
  };
}

// Empty parser constant
const e = function ({ index = 0, input }) {
  return { success: true, ast: null, index, input };
};

// Finish parser constant
const f = function ({ index = 0, input }) {
  return { success: index === input.length, ast: null, index, input };
};

module.exports = { s, a, m, o, l, n, t, e, f };
