"use strict";

var qfs = require('q-io/fs'),
  fs = require('fs'),
  _ = require('lodash'),
  QSVN = require('q-svn');

module.exports = SvnRelease;

function SvnRelease(cwd) {

  this.svn = new QSVN(cwd || '.');
  this.packageJson = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8'));
  var _svn = this.svn;

  this.synced = function () {
    return _svn
      .status()
      .then(failOnChanges);
  };

  this.version = function (version) {

    var packageJson = this.packageJson;
    return function () {
      packageJson.version = version;
      return qfs.write('package.json', JSON.stringify(packageJson, null, 2));
    };
  };

  this.commit = function () {
    return _svn.commit([], 'svn-release');
  };

  this.copy = function (source, target) {
    return function () {
      return _svn.copy(source, target, 'svn-release');
    };
  };
}

SvnRelease.prototype.branch = function (options) {

  var branchUrl = [options.repoRoot, options.branches, options.branchName].join('/');

  return this.synced()
    .then(this.version(options.branchVersion))
    .then(this.commit)
    .then(this.copy(options.repoUrl, branchUrl))
    .then(this.version(options.nextVersion))
    .then(this.commit);
};

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
