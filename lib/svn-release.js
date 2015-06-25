"use strict";

var qfs = require('q-io/fs'),
  fs = require('fs'),
  _ = require('lodash'),
  QSVN = require('q-svn');

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

  this.copy = function (source, target) {
    return function () {
      return svn.copy(source, target, 'svn-release');
    };
  };
}

SvnRelease.prototype.branch = function (options) {

  var branchUrl = [options.repoRoot, options.branches, options.branchName].join('/');

  return this.synced()
    .then(this.version(options.branchVersion))
    .then(this.commit())
    .then(this.copy(options.repoUrl, branchUrl))
    .then(this.version(options.nextVersion))
    .then(this.commit());
};