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
        .then(commit('svn-release: branch'))
        .then(copy(options.url, [options.repoRoot, options.branches, options.branchName].join('/'), 'svn-release: branch'))
        .done(console.log, console.log);
    });
}

function copy(source, target, message) {
  return _.partial(svn.copy, source, target, message);
}

function commit(message) {
  return _.partial(svn.commit, [], message);
}

function saveBranchVersion(branchVersion) {
  return loadPackageJson()
    .then(setBranchVersion)
    .then(storePackageJson);

  function setBranchVersion(packageJson) {
    packageJson.version = branchVersion;
    return packageJson;
  }
}

function loadPackageJson() {
  return fs.read('package.json')
    .then(JSON.parse);
}

function storePackageJson(packageJson) {
  return fs.write('package.json', JSON.stringify(packageJson));
}

function defaultBranchOptions() {

  return loadPackageJson()
    .then(onPackageJson);

  function onPackageJson(packageJson) {
    return _.extend({
      branchName: semver.major(packageJson.version) + '-' + semver.minor(packageJson.version),
      branchVersion: packageJson.version,
      nextVersion: semver.inc(packageJson.version, 'minor'),
      repoRoot: 'http:'
    }, defaultPaths);
  }
}

function mergedBranchOptions(branchOptions) {

  return defaultBranchOptions()
    .then(onDefaultBranchOptions);

  function onDefaultBranchOptions(defaultBranchOptions) {
    return _.extend(defaultBranchOptions, branchOptions);
  }
}