#!/bin/bash
# Reverts a published GitHub release to draft and deletes its git tag,
# so a maintainer can fix the underlying problem and re-publish without
# manual cleanup. Re-publishing a draft fires a fresh release.published
# event, which restarts the release workflow.
#
# Best-effort: each API call's failure is logged but does not abort the
# script, since we may be running against partial state (e.g. a tag
# that was never created, or a release that's already a draft).
#
# Required env vars:
#   GH_TOKEN     auth for `gh api`
#   REPO         owner/name (e.g. knex/knex)
#   RELEASE_ID   numeric GitHub release id
#   TAG          tag name to delete (e.g. 3.2.10)

set -uo pipefail

: "${GH_TOKEN:?required}"
: "${REPO:?required}"
: "${RELEASE_ID:?required}"
: "${TAG:?required}"

echo "::error::Deleting tag $TAG and reverting release $RELEASE_ID to draft."

# DELETE the tag BEFORE reverting the release to draft. if the second
# call fails, we're left with a published release pointing at a missing
# tag — visibly broken in the GitHub UI, hard to miss. the reverse
# order's failure mode is silent: a clean-looking draft with the stale
# tag still in git, which on re-publish would attach to the OLD commit
# and ship a release built against outdated source.
gh api -X DELETE "/repos/$REPO/git/refs/tags/$TAG" >/dev/null \
  || echo "::warning::Failed to delete tag $TAG"

gh api -X PATCH "/repos/$REPO/releases/$RELEASE_ID" -F draft=true >/dev/null \
  || echo "::warning::Failed to revert release $RELEASE_ID to draft"
