#!/bin/bash -e

npm install webpack@1.8.11

webpack=node_modules/.bin/webpack
babel=node_modules/.bin/babel
jshint=node_modules/.bin/jshint

rm -rf tmp
mkdir tmp
rm -rf build
mkdir build

rm -rf lib
mkdir lib
babel -D src/ --out-dir lib/

cp -r lib tmp/lib
cp knex.js tmp

node -p 'p=require("./package");p.main="lib";p.scripts=p.devDependencies=undefined;JSON.stringify(p,null,2)' > tmp/package.json

$webpack --config scripts/webpack.config.js tmp build/knex.js

rm -rf tmp