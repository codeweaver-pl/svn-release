"use strict";

var SvnReleaseUtils = require('./svn-release-utils'),
  QSVN = require('q-svn'),
  fs = require('q-io/fs'),
  semver = require('semver'),
  _ = require('lodash');

var svn = new QSVN('.'),
  sru = new SvnReleaseUtils(svn),
  defaultPaths = {
    trunk: 'trunk',
    branches: 'branches',
    tags: 'tags'
  };

module.exports = {
  branch: branch
};

function branch(branchOptions) {

  mergedBranchOptions(branchOptions)
    .then(function (options) {
      sru.noLocalChanges()
        .then(saveBranchVersion(options.branchVersion))
        .then(svn.commit)
        .done(console.log);
    })
}

function saveBranchVersion(branchVersion) {
  return fs.read("./package.json").then(JSON.parse).then(function (descriptor) {
    descriptor.version = branchVersion;
    return q(JSON.stringify(descriptor, null, 2));
  })
}

function loadCurrentVersion() {
  return fs.read('./package.json')
    .then(JSON.parse)
    .get('version');
}

function defaultBranchOptions() {
  return loadCurrentVersion()
    .then(onCurrentVersion());

  function onCurrentVersion(currentVersion) {
    return _.extend({
      branchName: semver.major(currentVersion) + '-' + semver.minor(currentVersion),
      branchVersion: currentVersion,
      nextVersion: semver.inc(currentVersion, 'minor'),
      repoRoot: 'http:'
    }, defaultPaths)
  }
}

function mergedBranchOptions(branchOptions) {

  return defaultBranchOptions().then(onDefaultBranchOptions);

  function onDefaultBranchOptions(defaultBranchOptions) {
    return _.extend(defaultBranchOptions, branchOptions);
  }
}


