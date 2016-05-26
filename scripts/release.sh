#!/bin/bash -e

git checkout master

changelog=node_modules/.bin/changelog

update_version() {
  echo "$(node -p "p=require('./${1}');p.version='${2}';JSON.stringify(p,null,2)")" > $1
  echo "Updated ${1} version to ${2}"
}

current_version=$(node -p "require('./package').version")

printf "Next version (current is $current_version)? "
read next_version

if ! [[ $next_version =~ ^[0-9]\.[0-9]+\.[0-9](-.+)? ]]; then
  echo "Version must be a valid semver string, e.g. 1.0.2 or 2.3.0-beta.1"
  exit 1
fi

next_ref="v$next_version"

git add -u
npm run build
git add -A build

npm test

update_version 'package.json' $next_version

git commit -am "release $next_version"
git tag $next_version

git push origin master
git push origin master --tags

echo "# Publishing docs"

git checkout gh-pages
git merge master
git push origin gh-pages
git checkout master

npm publish
