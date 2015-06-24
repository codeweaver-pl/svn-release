"use strict";

var q = require('q'),
  utils = require('./release-utils'),
  semver = require('semver'),
  _ = require('lodash'),
  QSVN = require('q-svn'),
  svn = new QSVN('.');

module.exports = {
  branch: branch
};

function branch(providedOptions) {

  return noLocalChanges()
    .then(mergeOptions)
    .then(function (options) {
      utils.setVersion(options.branchVersion)
        .then(commit)
        .then(copy(options.repoUrl, utils.branchUrl(options)))
        .then(utils.setVersion(options.nextVersion))
        .then(commit);
    });

  function mergeOptions() {

    return q.spread([utils.loadPackageJson(), svn.info()], defaultOptions).then(overrideDefaults);

    function defaultOptions(packageJson, repoInfo) {
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

    function overrideDefaults(defaultOptions) {
      return _.isObject(providedOptions) ? _.extend(defaultOptions, providedOptions) : defaultOptions;
    }
  }

  function copy(source, target) {
    return function () {
      return svn.copy(source, target, 'svn-release: branch');
    };
  }

  function commit() {
    return svn.commit([], 'svn-release: branch');
  }
}

function noLocalChanges() {
  return svn.status().then(utils.failOnChanges);
}