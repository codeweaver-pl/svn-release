"use strict";

var q = require('q'),
  QSVN = require('q-svn'),
  ReleaseUtils = require('./release-utils'),
  semver = require('semver'),
  _ = require('lodash');


var svn = new QSVN('.'),
  utils = new ReleaseUtils(svn);

module.exports = {
  branch: branch,
  release: release
};

function release(releaseOptions) {

  return noLocalChanges()
    .then(mergeReleaseOptions(releaseOptions))
    .then(function (options) {
      utils.setVersion(options.tagVersion)
        .then(commit())
        .then(copy(options.repoUrl, utils.tagUrl(options)))
        .then(utils.setVersion(options.nextVersion))
        .then(commit());
    });

  function mergeReleaseOptions(providedReleaseOptions) {

    return q.spread([utils.loadPackageJson(), svn.info()], defaultReleaseOptions)
      .then(mergeWithProvided);

    function defaultReleaseOptions(packageJson, repoInfo) {
      return {
        trunk: 'trunk',
        branches: 'branches',
        tags: 'tags',
        tagName: packageJson.version,
        tagVersion: packageJson.version,
        nextVersion: semver.inc(packageJson.version, 'patch'),
        repoRoot: repoInfo['repositoryroot'],
        repoUrl: repoInfo.url
      };
    }

    function mergeWithProvided(releaseOptions) {
      return _.extend(releaseOptions, providedReleaseOptions);
    }
  }

  function copy(source, target) {
    return function () {
      return svn.copy(source, target, 'svn-release: release');
    };
  }

  function commit() {
    return function () {
      return svn.commit([], 'svn-release: release');
    };
  }
}

function branch(branchOptions) {

  return noLocalChanges()
    .then(mergeBranchOptions(branchOptions))
    .then(function (options) {
      utils.setVersion(options.branchVersion)
        .then(commit())
        .then(copy(options.repoUrl, utils.branchUrl(options)))
        .then(utils.setVersion(options.nextVersion))
        .then(commit());
    });

  function mergeBranchOptions(providedBranchOptions) {

    return q.spread([utils.loadPackageJson(), svn.info()], defaultBranchOptions)
      .then(mergeWithProvided);

    function defaultBranchOptions(packageJson, repoInfo) {
      return {
        trunk: 'trunk',
        branches: 'branches',
        tags: 'tags',
        branchName: semver.major(packageJson.version) + '.' + semver.minor(packageJson.version),
        branchVersion: packageJson.version,
        nextVersion: semver.inc(packageJson.version, 'minor'),
        repoRoot: repoInfo['repositoryroot'],
        repoUrl: repoInfo.url
      };
    }

    function mergeWithProvided(branchOptions) {
      return _.extend(branchOptions, providedBranchOptions);
    }
  }

  function copy(source, target) {
    return function () {
      return svn.copy(source, target, 'svn-release: branch');
    };
  }

  function commit() {
    return function () {
      return svn.commit([], 'svn-release: branch');
    };
  }
}

function noLocalChanges() {
  return svn.status().then(utils.failOnChanges);
}