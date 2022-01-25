function tokenize(text, tokens) {
  const compiledRegex = new RegExp(
    Object.entries(tokens)
      .map(([type, regex]) => `(?<${type}>${regex.source})`)
      .join('|'),
    'yi'
  );

  let index = 0;
  const ast = [];

  while (index < text.length) {
    compiledRegex.lastIndex = index;
    const result = text.match(compiledRegex);

    if (result !== null) {
      const [type, text] = Object.entries(result.groups).find(
        ([name, group]) => group !== undefined
      );

      index += text.length;

      if (!type.startsWith('_')) {
        ast.push({ type, text });
      }
    } else {
      throw new Error(
        `No matching tokenizer rule found at: [${text.substring(index)}]`
      );
    }
  }

  return ast;
}

module.exports = {
  tokenize,
};
