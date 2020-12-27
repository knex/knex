const template = require('lodash/template');

const { readFile, writeFile } = require('./fs');

/**
 * Light wrapper over lodash templates making it safer to be used with javascript source code.
 *
 * In particular, doesn't interfere with use of interpolated strings in javascript.
 *
 * @param {string} content Template source
 * @param {_.TemplateOptions} options Template options
 */
const jsSourceTemplate = (content, options) =>
  template(content, {
    interpolate: /<%=([\s\S]+?)%>/g,
    ...options,
  });

/**
 * Compile the contents of specified (javascript) file as a lodash template
 *
 * @param {string} filePath Path of file to be used as template
 * @param {_.TemplateOptions} options Lodash template options
 */
const jsFileTemplate = async (filePath, options) => {
  const contentBuffer = await readFile(filePath);
  return jsSourceTemplate(contentBuffer.toString(), options);
};

/**
 * Write a javascript file using another file as a (lodash) template
 *
 * @param {string} targetFilePath
 * @param {string} sourceFilePath
 * @param {_.TemplateOptions} options options passed to lodash templates
 */
const writeJsFileUsingTemplate = async (
  targetFilePath,
  sourceFilePath,
  options,
  variables
) =>
  writeFile(
    targetFilePath,
    (await jsFileTemplate(sourceFilePath, options))(variables)
  );

module.exports = {
  jsSourceTemplate,
  jsFileTemplate,
  writeJsFileUsingTemplate,
};
