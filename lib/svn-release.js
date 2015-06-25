"use strict";

var qfs = require('q-io/fs'),
  fs = require('fs'),
  _ = require('lodash'),
  QSVN = require('q-svn');

module.exports = SvnRelease;

function SvnRelease(cwd) {

  this.svn = new QSVN(cwd || '.');

  this.packageJson = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8'));

  this.copy = function(source, target) {
    var svn = this.svn;
    return function() {
      return svn.copy(source, target, 'svn-release');
    };
  };

  this.commit = function() {
    return this.svn.commit([], 'svn-release');
  };

  this.synced = function() {
    return this.svn
      .status()
      .then(failOnChanges);
  };

  this.version = function(version) {
    var packageJson = this.packageJson;
    return function() {
      packageJson.version = version;
      return qfs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    }
  };
}

SvnRelease.prototype.branch = function(options) {

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
