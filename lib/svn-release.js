"use strict";

var qfs = require('q-io/fs'),
  fs = require('fs'),
  log = require('npmlog'),
  _ = require('lodash'),
  QSVN = require('q-svn');

log.enableColor();

module.exports = SvnRelease;

function SvnRelease(cwd) {

  var svn = new QSVN(cwd || '.'),
    packageJson = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8'));

  this.synced = function () {
    return svn.status()
      .then(failOnChanges);

    function failOnChanges(status) {
      if (_.any(status, isChange)) {
        throw new Error(
          'changes in working copy detected:\n' +
          _.chain(status)
            .filter(isChange)
            .map(rowString)
            .value()
            .join('\n'));
      }

      return 'no changes detected';

      function isChange(statusRow) {
        return '?' !== statusRow.status;
      }

      function rowString(statusRow) {
        return statusRow.status + ' ' + statusRow.path;
      }
    }
  };

  this.version = function (version) {
    return function () {
      packageJson.version = version;
      return qfs.write('package.json', JSON.stringify(packageJson, null, 2));
    };
  };

  this.commit = function () {
    return function () {
      return svn.commit([], 'svn-release');
    };
  };

  this.copy = function (branches, branchName) {
    return function () {
      return svn.info()
        .then(copy);

      function copy(info) {
        return svn.copy(
          info['url'],
          [info['repositoryroot'], branches, branchName].join('/'),
          'svn-release'
        );
      }
    };
  };

  this.revert = function () {
    return function () {
      return svn.revert('.', '--recursive');
    };
  };
}

/**
 * A setup object for branching procedure
 * @typedef {Object} BranchOptions
 * @property {string} repoRoot A repository root URL
 * @property {string} repoUrl Working copy's repo URL
 * @property {string} branchName
 * @property {string} branchVersion
 * @property {string} nextVersion
 * @property {string} branches
 */
SvnRelease.prototype.branch = function (options) {

  var mod = this;

  return mod.synced()
    .then(doBranch(), onError);

  function doBranch() {

    return function () {
      return mod.version(options.branchVersion)()
        .then(mod.commit())
        .then(mod.copy(options.branches, options.branchName))
        .then(mod.version(options.nextVersion))
        .then(mod.commit())
        .fail(function (error) {
          onError(error);
          mod.revert();
        });
    };
  }
};

SvnRelease.prototype.release = function (options) {

  return this.synced()
    .fail(onError);
};

function onError(error) {
  log.stream = process.stderr;
  log.error('svn-release', 'procedure failed with:', error);
}