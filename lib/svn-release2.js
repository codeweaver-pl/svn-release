"use strict";

var SVN = require('./node.svn-extended');
var releaseSteps = require('./svn-release-steps');
var argv = require('yargs').argv;
var _ = require('lodash');
var semver = require('semver');
var fs = require('fs');
var async = require('async');

function Config() {
  this.cwd = './';
  this.username = argv.username ? argv.username : this.username;
  this.password = argv.password ? argv.password : this.password;
}

module.exports = {
  branch: branch,
  releasePrepare: releasePrepare,
  releasePerform: releasePerform,
  releaseRollback: releaseRollback,
  releaseClean: releaseClean
};

function branch(config, mainCallback) {
  async.series([
    releaseSteps.hasChanges,
    releaseSteps.setVersion(config.branchVersion()),
    releaseSteps.workingCopyRepoUrl,
    releaseSteps.tagWorkingCopy(releaseSteps.normalizedRepoUrl(config.branchesP, config.branchName())),
    releaseSteps.setVersion(config.developmentVersion())
  ], mainCallback)
}

function releasePrepare() {}
function releasePerform() {}
function releaseRollback() {}
function releaseClean() {}


 function safeAddDir(config, callback) {

  var svn = new SVN(new Config());

  async.waterfall([
      fetchIgnore,
      unignoreOutput,
      addOutput
    ],
    callback
  );

  function fetchIgnore(callback) {
    svn.pg('svn:ignore', '.', callback);
  }

  function unignoreOutput(ignoreData, callback) {
    svn.ps('svn:ignore', _.without(ignoreData.split('\n'), dirname).join('\n'), '.', callback);
  }

  function addOutput(callback) {
    svn.add(dirname, callback);
  }
}
