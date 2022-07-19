#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require("child_process");

function main() {
  const repoDir = path.dirname(__dirname)
  const gitDir = path.join(repoDir, '.git')
  const gitDirExists = doesDirectoryExist(gitDir)
  if (!gitDirExists) {
    console.log("No .git directory detected so can not clean 'lib/'. Exiting.")
    process.exit(0)
  }
  console.log("Cleaning 'lib/' of outputted files from Typescript compilation ...")
  const cmd = 'git clean -f -X lib/'
  const output = execSync(cmd, { cwd: repoDir })
  console.log(output.toString('utf8'))
  console.log('Done')
}

function doesDirectoryExist(p) {
  if (fs.existsSync(p)) {
    return fs.lstatSync(p).isDirectory()
  }
  return false
}

main()
