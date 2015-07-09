#!/usr/bin/env node
"use strict";

/**
 * @typedef {*} Mixed
 */

var program       = require('commander'),
    fs            = require('fs'),
    SvnReleaseCli = require('./svn-release-cli'),
    SvnRelease    = require('../lib/svn-release'),
    SvnDefaults   = require('../lib/svn-defaults'),

    packageJson   = JSON.parse(fs.readFileSync('./package.json', 'utf8')),
    svnDefaults   = new SvnDefaults(packageJson.version),
    svnRelease    = new SvnRelease('.');

program
  .usage('<cmd> [options...]')
  .version('0.0.1', '-V, --version')
  .allowUnknownOption(false)
  .option('-I, --interactive',
          'perform branch or release tasks in interactive mode',
          SvnReleaseCli.boolean,
          false);

program
  .command('branch')
  .description('create new branch, based on current working copy')
  .option('-n, --branch-name [name]',
          'override default branch name',
          SvnReleaseCli.name,
          svnDefaults.branchName)
  .option('-b, --branch-version [version]',
          'override default branch version',
          SvnReleaseCli.version,
          svnDefaults.branchVersion)
  .option('-N, --next-version [version]',
          'override next version',
          SvnReleaseCli.version,
          svnDefaults.postBranchVersion)
  .option('-B, --branches [path]',
          'relative path to branches',
          SvnReleaseCli.uri,
          'branches')
  .action(doBranch);

program
  .command('release')
  .description('create new release, based on current working copy')
  .option('-n, --release-name [name]',
          'overrides default release version',
          SvnReleaseCli.name,
          svnDefaults.releaseName)
  .option('-r, --release-version [version]',
          'overrides default release version',
          SvnReleaseCli.version,
          svnDefaults.releaseVersion)
  .option('-N, --next-version [version]',
          'overrides next version',
          SvnReleaseCli.version,
          svnDefaults.postReleaseVersion)
  .option('-d, --dist [dist-folder]',
          'include distribution folder on release',
          SvnReleaseCli.name,
          null)
  .option('-R, --releases [path]',
          'relative path to releases (tags)',
          SvnReleaseCli.uri,
          'tags')
  .action(doRelease);

program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
}

function doBranch(options) {
  svnRelease.branch(
    SvnReleaseCli.branchOptions(options)
  ).done();
}

function doRelease(options) {
  svnRelease.release(
    SvnReleaseCli.releaseOptions(options)
  ).done();
}