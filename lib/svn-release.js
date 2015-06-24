"use strict";

var SvnReleaseUtils = require('./svn-release-utils'),
  QSVN = require('q-svn'),
  fs = require('q-io/fs'),
  q = require('q'),
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
        .then(setVersion(options.branchVersion))
        .then(commit('svn-release: branch'))
        .then(copy(options.repoUrl, [options.repoRoot, options.branches, options.branchName].join('/'), 'svn-release: branch'))
        .then(setVersion(options.nextVersion))
        .then(commit('svn-release: branch'))
        .done(console.log);
    });

  function mergedBranchOptions(branchOptions) {

    return defaultBranchOptions()
      .then(onDefaultBranchOptions);

    function onDefaultBranchOptions(defaultBranchOptions) {
      return _.extend(defaultBranchOptions, branchOptions);
    }

    function defaultBranchOptions() {

      return q.spread([loadPackageJson(), svn.info()], function (packageJson, repoInfo) {
        return _.extend({
          branchName: semver.major(packageJson.version) + '.' + semver.minor(packageJson.version),
          branchVersion: packageJson.version,
          nextVersion: semver.inc(packageJson.version, 'minor'),
          repoRoot: repoInfo['repositoryroot'],
          repoUrl: repoInfo.url
        }, defaultPaths);
      });
    }
  }
}

function copy(source, target, message) {
  return function () {
    return svn.copy(source, target, message);
  };
}

function commit(message) {
  return function () {
    svn.commit([], message);
  };
}

function setVersion(version) {

  return loadPackageJson()
    .then(updateVersion)
    .then(storePackageJson);

  function updateVersion(packageJson) {
    packageJson.version = version;
    return packageJson;
  }
}

function loadPackageJson() {
  return fs.read('package.json')
    .then(JSON.parse);
}

function storePackageJson(packageJson) {
  return fs.write('package.json', JSON.stringify(packageJson, null, 2));
}