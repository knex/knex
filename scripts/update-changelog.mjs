#!/usr/bin/env node
// Inserts a new release section into docs/src/changelog.md, taking the
// content from the published GitHub release body. The release body's
// structure is enforced by the validate job in release.yml (categories
// must be from a known set, bullets must match the change-template
// format), so the transformations here are straightforward.
//
// Usage:  node scripts/update-changelog.mjs <version> <release-id>
// Requires: gh CLI authenticated (GH_TOKEN/GITHUB_TOKEN).

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const VERSION = process.argv[2];
const RELEASE_ID = process.argv[3];

if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(VERSION || '')) {
  console.error('Usage: update-changelog.mjs <version> <release-id>');
  process.exit(1);
}
if (!/^\d+$/.test(RELEASE_ID || '')) {
  console.error('Usage: update-changelog.mjs <version> <release-id>');
  process.exit(1);
}

const REPO = process.env.GITHUB_REPOSITORY || 'knex/knex';
const CHANGELOG_PATH = 'docs/src/changelog.md';

const release = JSON.parse(
  execFileSync('gh', ['api', `/repos/${REPO}/releases/${RELEASE_ID}`], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
);

let body = release.body || '';

// strip the trailing "## New Contributors" section and the
// "**Full Changelog**" line; the docs changelog doesn't carry these.
body = body.replace(/\n+## New Contributors[\s\S]*$/m, '');
body = body.replace(/\n+\*\*Full Changelog\*\*:.*$/m, '');

// strip an outer "## What's Changed" wrapper if present (release-drafter
// no longer emits one, but a maintainer might add it manually). each
// category already has its own bold header.
body = body.replace(/^## What's Changed\s*\n+/m, '');

// transform release-format bullets
//   "* TITLE by @AUTHOR in #NUMBER"
// into docs-format bullets
//   "- TITLE [#NUMBER](https://github.com/OWNER/REPO/pull/NUMBER)"
// which matches the historical style of docs/src/changelog.md while
// keeping by-author attribution on the GitHub release itself. only
// horizontal whitespace at end-of-line — `\s*$` would greedily consume
// blank lines between categories.
const bullet = /^([*-])[ \t]+(.+?)[ \t]+by[ \t]+@\S+[ \t]+in[ \t]+#(\d+)[ \t]*$/gm;
body = body.replace(
  bullet,
  (_m, _b, title, num) =>
    `- ${title} [#${num}](https://github.com/${REPO}/pull/${num})`
);

body = body.trim();

if (!body) {
  console.error('Release body is empty after transform; nothing to insert');
  process.exit(0);
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const now = new Date();
const date = `${now.getUTCDate()} ${
  months[now.getUTCMonth()]
}, ${now.getUTCFullYear()}`;

const block = `### ${VERSION} - ${date}\n\n${body}\n\n`;

const existing = readFileSync(CHANGELOG_PATH, 'utf8');

// idempotency: skip if a section for this version already exists. allows
// the workflow to be re-run after a transient failure without producing
// duplicate entries.
const versionHeader = new RegExp(
  `^### ${VERSION.replace(/[.+]/g, '\\$&')}(\\s|$)`,
  'm'
);
if (versionHeader.test(existing)) {
  console.error(
    `${CHANGELOG_PATH} already has a section for ${VERSION}; skipping`
  );
  process.exit(0);
}

// match "## Changelog" plus its following blank line(s).
const updated = existing.replace(/^(## Changelog\n\n?)/, `$1${block}`);
if (updated === existing) {
  console.error(`Could not find "## Changelog" header in ${CHANGELOG_PATH}`);
  process.exit(1);
}

writeFileSync(CHANGELOG_PATH, updated);
console.error(`Inserted ${VERSION} section into ${CHANGELOG_PATH}`);
