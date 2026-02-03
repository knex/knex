#!/bin/bash -e

# context: currently, no package lockfile is utilized in this repository.
# this is so that CI tests run on the ~latest versions of dependencies,
# especially the peer dependencies of database clients, so that our tests
# will more readily surface problems that our users will experience when
# they just do the normal thing.

# however, for automatic release publishing, we want to be much stricter
# with the dependencies that are involved in the workflow to avoid risks
# from e.g. supply chain attacks.

# we could use "npm ci" if we had a lockfile, but instead we're going to
# separately maintain pinned versions of the build dependencies and run
# exactly those versions. care should be taken when updating/altering the
# versions to vet them.

# pinned versions of the dependencies required to perform a release build
declare -A PINNED_VERSIONS=(
  [typescript]="5.0.4"
  [prettier]="2.8.7"
  [@types/node]="20.19.11"
  [@tsconfig/node12]="1.0.11"
)

# validate args
BUMP_TYPE="$1"
case "$BUMP_TYPE" in
  major|minor|patch)
    # valid
  ;;
  *)
    >&2 echo "Invalid bump type. Use: $0 {major|minor|patch}"
    exit 1
  ;;
esac


# npm 7 doesn't provide a way to install only a specific dependency, it's
# all-or-nothing. so we have to do some shenanigans to validate our pinned
# versions against package.json

# create a jq expression for a minimal package.json that includes only
# our build dependencies
tmpl='
{
  name: "dep-check",
  private: true,
  version: "0.0.0",
  devDependencies: {
'
for pkg in "${!PINNED_VERSIONS[@]}"; do
  # for each pinned dependency, add something like:
  # pkg: .devDependencies.pkg
  tmpl+="    \"${pkg}\": .devDependencies[\"${pkg}\"],
"
done
tmpl+='
  }
}'

PROJECT_DIR="$(pwd)"
TMP_DIR="$(mktemp -d)"

# render the template to a package.json file in a temp dir
echo
echo "Build dependencies:"
jq "$tmpl" package.json | tee "$TMP_DIR/package.json"

# install dependencies at the pinned version in the temp dir
# ignore pre/post script hooks
echo
echo "Installing packages"
>/dev/null pushd "$TMP_DIR"

failed=0
for pkg in "${!PINNED_VERSIONS[@]}"; do
  fqpkg="${pkg}@${PINNED_VERSIONS[$pkg]}"
  echo "npm install --no-save --ignore-scripts $fqpkg"
  >/dev/null 2>/dev/null npm install --no-save --ignore-scripts "$fqpkg"


  # ensure the pinned version conforms to package.json semver specification
  if npm ls 2>/dev/null | grep invalid; then
    failed=1
  fi
done

# one or more pins is incorrect, do not publish
if [[ "$failed" = 1 ]]; then
  echo
  echo "One or more pinned dependencies do not satisfy package.json requirements"
  echo "Please update '$0'"
  exit 1
fi

>/dev/null popd

# move tempdir node_modules to build dir
mv "$TMP_DIR/node_modules" "$PROJECT_DIR/node_modules"
echo
echo "node_modules:"
ls -l node_modules

echo "Running build steps"

# run the package.json build script
# currently, this executes typescript and uses
# prettier to format the TS output
npm run build

# bump the version in package.json
npm version "$BUMP_TYPE" --no-git-tag-version

# we don't commit here, but we do create the tarball that
# will be published to npm. the dependent job takes the
# tarball and commits the changes + publishes the tarball

# create the tarball for handoff and record its filename
TARBALL="$(npm pack --silent)"
echo "tarball=$TARBALL" >> "$GITHUB_OUTPUT"
ls -la "$TARBALL"