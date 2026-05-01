#!/usr/bin/env node
// Inserts a new release section at the top of docs/src/changelog.md.
//
// Usage:  node scripts/update-changelog.mjs <version>
// Requires: gh CLI authenticated (GH_TOKEN/GITHUB_TOKEN).
//
// Strategy: list commits between the previous tag and HEAD via the
// GitHub compare API, look up the PR associated with each commit, then
// group PRs by category (PR labels, falling back to conventional-commit
// title prefixes). Categories match the headings used historically in
// docs/src/changelog.md.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const VERSION = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(VERSION || '')) {
  console.error('Usage: update-changelog.mjs <version>');
  process.exit(1);
}

const REPO = process.env.GITHUB_REPOSITORY || 'knex/knex';
const CHANGELOG_PATH = 'docs/src/changelog.md';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}
function gh(path) {
  const out = execFileSync('gh', ['api', path], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

// previous tag = the most recent semver tag that isn't the new release.
// release-drafter has already created VERSION at HEAD, so we need to
// exclude it from the lookup.
const prevTag = git(
  'tag',
  '--list',
  '--sort=-version:refname',
  '--format=%(refname:short)'
)
  .split('\n')
  .map((s) => s.trim())
  .filter((t) => t && t !== VERSION)[0];

if (!prevTag) {
  console.error('Could not determine previous tag');
  process.exit(1);
}

console.error(`Generating changelog for ${prevTag}...${VERSION}`);

const compare = gh(`/repos/${REPO}/compare/${prevTag}...HEAD`);

// dedupe PRs across commits (squash merges → one commit per PR, but
// merge commits include every PR commit individually).
const prs = new Map();
for (const commit of compare.commits) {
  const associated = gh(`/repos/${REPO}/commits/${commit.sha}/pulls`);
  for (const pr of associated) {
    if (pr.base?.ref === 'master' && !prs.has(pr.number)) {
      prs.set(pr.number, pr);
    }
  }
}

function categorize(pr) {
  const labels = new Set(pr.labels.map((l) => l.name));
  if (labels.has('skip-release') || labels.has('skip-changelog')) return null;
  if (labels.has('feature') || labels.has('minor')) return 'features';
  if (labels.has('bug') || labels.has('fix')) return 'fixes';
  if (labels.has('docs')) return 'docs';
  if (labels.has('types') || labels.has('typescript')) return 'types';
  if (labels.has('tests') || labels.has('test')) return 'tests';
  if (labels.has('chore') || labels.has('dependencies')) return 'chore';

  // fall back to conventional-commit-style title prefix.
  const m = pr.title.match(/^(\w+)(?:\([\w/.-]+\))?!?:/);
  if (m) {
    const type = m[1].toLowerCase();
    if (type === 'feat' || type === 'feature') return 'features';
    if (type === 'fix') return 'fixes';
    if (type === 'docs' || type === 'doc') return 'docs';
    if (type === 'test' || type === 'tests') return 'tests';
    if (type === 'types' || type === 'type') return 'types';
    if (
      type === 'chore' ||
      type === 'deps' ||
      type === 'build' ||
      type === 'ci'
    )
      return 'chore';
  }

  // last-resort: bucket by the bump label if present.
  if (labels.has('patch')) return 'fixes';
  if (labels.has('major')) return 'features';
  return 'chore';
}

const groups = {
  features: [],
  fixes: [],
  types: [],
  tests: [],
  docs: [],
  chore: [],
};
for (const pr of prs.values()) {
  const cat = categorize(pr);
  if (cat) groups[cat].push(pr);
}

const titles = {
  features: 'New features',
  fixes: 'Bug fixes',
  types: 'Types',
  tests: 'Tests',
  docs: 'Docs',
  chore: 'Chore',
};

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

let block = `### ${VERSION} - ${date}\n\n`;
let any = false;
for (const [key, items] of Object.entries(groups)) {
  if (items.length === 0) continue;
  any = true;
  block += `**${titles[key]}**\n\n`;
  // sort by PR number for stable ordering
  items.sort((a, b) => a.number - b.number);
  for (const pr of items) {
    block += `- ${pr.title} [#${pr.number}](https://github.com/${REPO}/pull/${pr.number})\n`;
  }
  block += `\n`;
}

if (!any) {
  console.error('No PRs found in range; skipping changelog update');
  process.exit(0);
}

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
