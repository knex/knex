#!/usr/bin/env node
// Inserts a new release section into both CHANGELOG.md (root, shipped on
// npm) and docs/src/changelog.md (rendered on knexjs.org), taking the
// content from $RELEASE_BODY (the GitHub release body). The release
// body's structure is enforced by the validate job in release.yml
// (categories must be from a known set, bullets must match the
// change-template format), so the transformations here are
// straightforward.
//
// Usage:  RELEASE_BODY="..." node scripts/update-changelog.mjs <version>
//
// Body is passed via env (not stdin or argv) so the workflow can hand it
// off without needing read access to draft releases via the GitHub API.

import { readFileSync, writeFileSync } from 'node:fs';

const VERSION = process.argv[2];

if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(VERSION || '')) {
  console.error('Usage: RELEASE_BODY="..." update-changelog.mjs <version>');
  process.exit(1);
}
if (process.env.RELEASE_BODY == null) {
  console.error('RELEASE_BODY env var is required');
  process.exit(1);
}

const REPO = process.env.GITHUB_REPOSITORY || 'knex/knex';
const ROOT_PATH = 'CHANGELOG.md';
const DOCS_PATH = 'docs/src/changelog.md';

let body = process.env.RELEASE_BODY;

// strip the trailing "## New Contributors" section and the
// "**Full Changelog**" line; neither changelog file carries these.
body = body.replace(/\n+## New Contributors[\s\S]*$/m, '');
body = body.replace(/\n+\*\*Full Changelog\*\*:.*$/m, '');

// strip an outer "## What's Changed" wrapper if present (release-drafter
// no longer emits one, but a maintainer might add it manually). each
// category already has its own bold header.
body = body.replace(/^## What's Changed\s*\n+/m, '');

// transform release-format bullets
//   "* TITLE by @AUTHOR in #NUMBER"
// into changelog-format bullets
//   "- TITLE [#NUMBER](https://github.com/OWNER/REPO/pull/NUMBER)"
// which matches the historical style of both changelog files while
// keeping by-author attribution on the GitHub release itself. only
// horizontal whitespace at end-of-line — `\s*$` would greedily consume
// blank lines between categories.
const bullet =
  /^([*-])[ \t]+(.+?)[ \t]+by[ \t]+@\S+[ \t]+in[ \t]+#(\d+)[ \t]*$/gm;
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

// docs/src/changelog.md: "### VERSION - DATE" + "**Section**" headers.
const docsBlock = `### ${VERSION} - ${date}\n\n${body}\n\n`;

// CHANGELOG.md (root): "# VERSION - DATE" + "### Section" headers.
const rootBlock = docsBlock
  .replace(/^### /m, '# ')
  .replace(/^\*\*([^*]+)\*\*$/gm, '### $1');

// escape every regex metacharacter (the standard MDN pattern)
const escVersion = VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function update(path, header, replacement) {
  const existing = readFileSync(path, 'utf8');

  // idempotency: skip if a section for this version already exists.
  // allows the workflow to be re-run after a transient failure without
  // producing duplicate entries.
  const versionHeader = new RegExp(`^#{1,3} ${escVersion}(\\s|$)`, 'm');
  if (versionHeader.test(existing)) {
    console.error(`${path} already has a section for ${VERSION}; skipping`);
    return;
  }

  const updated = existing.replace(header, replacement);
  if (updated === existing) {
    console.error(`Could not find expected header in ${path}`);
    process.exit(1);
  }
  writeFileSync(path, updated);
  console.error(`Inserted ${VERSION} section into ${path}`);
}

// docs: insert after "## Changelog\n\n".
update(DOCS_PATH, /^(## Changelog\n\n?)/, `$1${docsBlock}`);

// root: replace the "# Master (Unreleased)" line (linked or plain) with
// a fresh Master link pointing at the new compare range, followed by the
// just-released version's section.
const masterHeader = `# [Master (Unreleased)](https://github.com/${REPO}/compare/${VERSION}...master)\n\n`;
update(
  ROOT_PATH,
  /^# (?:\[Master \(Unreleased\)\][^\n]*|Master \(Unreleased\))\n+/m,
  `${masterHeader}${rootBlock}`
);
