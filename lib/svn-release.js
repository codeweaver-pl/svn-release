"use strict";

var q = require('q'),
  QSVN = require('q-svn'),
  fs = require('q-io/fs'),
  semver = require('semver'),
  _ = require('lodash');


var svn = new QSVN('.'),
  defaultPaths = {
    trunk: 'trunk',
    branches: 'branches',
    tags: 'tags'
  };

module.exports = {
  branch: branch
};

function branch(branchOptions) {

  return noLocalChanges()
    .then(mergeBranchOptions(branchOptions))
    .then(function (options) {
      setVersion(options.branchVersion)
        .then(commit('svn-release: branch'))
        .then(copy(options.repoUrl, [options.repoRoot, options.branches, options.branchName].join('/'), 'svn-release: branch'))
        .then(setVersion(options.nextVersion))
        .then(commit('svn-release: branch'));
    });

  function mergeBranchOptions(branchOptions) {

    return q.spread([loadPackageJson(), svn.info()], function (packageJson, repoInfo) {
      return _.extend({
        branchName: semver.major(packageJson.version) + '.' + semver.minor(packageJson.version),
        branchVersion: packageJson.version,
        nextVersion: semver.inc(packageJson.version, 'minor'),
        repoRoot: repoInfo['repositoryroot'],
        repoUrl: repoInfo.url
      }, defaultPaths, branchOptions);
    });
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

function noLocalChanges() {

  return svn.status()
    .then(failOnChanges);

  function failOnChanges(status) {

    if (_.any(status, isChange)) {
      throw new Error(
        _.reduce(
          _.filter(status, isChange),
          function (accumulator, statusRow) {
            return accumulator + statusRow.status + ' ' + statusRow.path + '\n';
          },
          'changes in working copy detected: \n'
        ));
    }

    return q([]);

    function isChange(statusRow) {
      return statusRow.status !== '?';
    }
  }
}