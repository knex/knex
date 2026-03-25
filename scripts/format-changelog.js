const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { greenBright, redBright } = require('colorette');

const CHANGELOG = resolve(__dirname, '..', 'CHANGELOG.md');
const lines = readFileSync(CHANGELOG, 'utf-8').split(/\r?\n/);

// ensure that every `#NNNN` is a markdown link
// to https://github.com/knex/knex/issues/NNNN
//
// https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
//
// GitHub's REST API considers every pull request an issue, but not every issue is a pull request.
// For this reason, "Issues" endpoints may return both issues and pull requests in the response.
//
// Web links to /issues/NNNN will redirect to /pull/NNNN

// match first: a markdown link, then: #NNNN
const markdownRE = /\[#(\d+)\]\(([^)]+)\)/;
const referenceRE = /#(\d+)/;
const regex = new RegExp(`${markdownRE.source}|${referenceRE.source}`, 'g');
// eslint-disable-next-line no-control-regex
const ansiRegex = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const stripAnsi = (str) => str.replace(ansiRegex, '');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const newLine = line.replace(regex, (match, anchor, url, issueno) => {
    if (issueno !== undefined) {
      return `${greenBright('[#')}${issueno}${greenBright(
        `](https://github.com/knex/knex/issues/${issueno})`
      )}`;
    }

    if (url !== undefined && anchor !== undefined) {
      if (!url.endsWith(`/${anchor}`)) {
        console.warn('Mismatched URL:', url);
        return `${redBright(
          `[#${anchor}](https://github.com/knex/knex/issues/${anchor})`
        )}`;
      } else {
        return match;
      }
    }
    throw new Error('Regex failed');
  });

  if (line !== newLine) {
    lines[i] = stripAnsi(newLine);
    console.log(newLine);
  }
}

writeFileSync(CHANGELOG, lines.join('\n'), 'utf-8');
