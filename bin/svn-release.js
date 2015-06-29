#!/usr/bin/env node
"use strict";

/**
 * @typedef {*} Mixed
 */

var URI_REGEXP = /^(((?:(?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(:(?:\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|([a-z0-9+.-]+:)(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(\?(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?(#(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?$/i,
  BOOLEAN_REGEXP = /^((true)|(false))$/i,
  NAME_REGEXP = /^[\w-]+$/i,

  program = require('commander'),
  log = require('npmlog'),
  semverRegex = require('semver-regex'),
  fs = require('fs'),
  SvnRelease = require('../lib/svn-release'),
  SvnDefaults = require('../lib/svn-defaults'),

  packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8')),
  svnDefaults = new SvnDefaults(packageJson.version);

log.stream = process.stdout;
log.enableColor();

program
  .usage('<cmd> [options...]')
  .version('0.0.1', '-V, --version')
  .option('-I, --interactive', 'perform branch or release tasks in interactive mode', BOOLEAN_REGEXP, false);

program
  .command('branch')
  .description('create new branch, based on current working copy')
  .option('-n, --branch-name [name]', 'override default branch name', NAME_REGEXP, svnDefaults.branchName)
  .option('-b, --branch-version [version]', 'override default branch version', semverRegex, svnDefaults.branchVersion)
  .option('-N, --next-version [version]', 'override next version', semverRegex, svnDefaults.postBranchVersion)
  .option('-B, --branches [path]', 'relative path to branches', URI_REGEXP, 'branches')
  .action(doBranch);

program
  .command('release')
  .description('create new release, based on current working copy')
  .option('-n, --release-name [name]', 'overrides default release version', NAME_REGEXP, svnDefaults.releaseName)
  .option('-r, --release-version [version]', 'overrides default release version', semverRegex, svnDefaults.releaseVersion)
  .option('-N, --next-version [version]', 'overrides next version', semverRegex, svnDefaults.postReleaseVersion)
  .option('-d, --dist [dist-folder]', 'include distribution folder on release', NAME_REGEXP, '')
  .option('-R, --releases [path]', 'relative path to tags/releases', URI_REGEXP, 'tags')
  .action(doRelease);

program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
}

function doBranch(options) {

  var opts = {
    branches: options.branches,
    branchName: options.branchName,
    branchVersion: options.branchVersion,
    nextVersion: options.nextVersion
  };

  log.info('svn-release', 'branch procedure executed with: %j', opts);

  new SvnRelease('.').branch(opts);
}

function doRelease(options) {

  var opts = {
    releases: options.releases,
    releaseName: options.releaseName,
    releaseVersion: options.releaseVersion,
    nextVersion: options.nextVersion
  };

  if (options.dist.length) {
    opts.dist = options.dist;
  }

  log.info('svn-release', 'release procedure executed with: %j', opts);

  new SvnRelease('.').release(opts);
}