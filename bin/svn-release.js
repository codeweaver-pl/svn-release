#!/usr/bin/env node
"use strict";

/**
 * @typedef {*} Mixed
 */

var URI_REGEX     = /^(((?:(?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(:(?:\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|([a-z0-9+.-]+:)(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(\?(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?(#(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?$/i,
    BOOLEAN_REGEX = /^((true)|(false))$/i,
    NAME_REGEX    = /^[\w-]+$/i,

    semverRegex   = require('semver-regex'),
    program       = require('commander'),
    fs            = require('fs'),
    SvnRelease    = require('../lib/svn-release'),
    logger        = require('../lib/svn-logger'),

    packageJson   = JSON.parse(fs.readFileSync('./package.json', 'utf8')),
    svnDefaults   = new SvnRelease.SvnDefaults(packageJson.version),
    svnRelease    = new SvnRelease('.'),
    action        = null,
    actionOptions = null;

program
  .usage('<cmd> [options...]')
  .version(packageJson.version, '-V, --version')
  .allowUnknownOption(false)
  .option('-I, --interactive',
          'perform branch or release tasks in interactive mode',
          BOOLEAN_REGEX,
          false);

program
  .command('branch')
  .description('create new branch, based on current working copy')
  .option('-n, --branch-name [name]',
          'override default branch name',
          NAME_REGEX,
          svnDefaults.branchName)
  .option('-b, --branch-version [version]',
          'override default branch version',
          semverRegex,
          svnDefaults.branchVersion)
  .option('-N, --next-version [version]',
          'override next version',
          semverRegex,
          svnDefaults.postBranchVersion)
  .option('-B, --branches [path]',
          'relative path to branches',
          URI_REGEX,
          'branches')
  .action(onBranch);

program
  .command('release')
  .description('create new release, based on current working copy')
  .option('-n, --release-name [name]',
          'overrides default release version',
          NAME_REGEX,
          svnDefaults.releaseName)
  .option('-r, --release-version [version]',
          'overrides default release version',
          semverRegex,
          svnDefaults.releaseVersion)
  .option('-N, --next-version [version]',
          'overrides next version',
          semverRegex,
          svnDefaults.postReleaseVersion)
  .option('-d, --dist [dist-folder]',
          'include distribution folder on release',
          NAME_REGEX,
          null)
  .option('-R, --releases [path]',
          'relative path to releases (tags)',
          URI_REGEX,
          'tags')
  .action(onRelease);

program.parse(process.argv);

svnRelease[action](actionOptions)
  .done(onFulfilled, onRejected);

if (!program.args.length) {
  program.outputHelp();
}

function onBranch(options) {
  actionOptions = svnDefaults.branchOptions(options);
  action        = 'branch';
}

function onRelease(options) {
  actionOptions = svnDefaults.releaseOptions(options);
  action        = 'release';
}

function onFulfilled(value) {
  logger.info('execution successful');
  logger.debug('last call result:', JSON.stringify(value));
}

function onRejected(reason) {
  logger.error('execution failed');
  logger.warn('error:', reason);
}
