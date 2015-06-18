"use strict";

var SVN_DEFAULTS = {
    cwd: '.',
    paths: {
      trunk: 'trunk',
      branches: 'branches',
      tags: 'tags'
    },
    encoding: 'utf-8'
  },
  semver = require('semver'),
  QSVN = require('./q-svn'),
  Q = require('q'),
  _ = require('lodash'),
  fs = require('fs'),
  util = require('util'),
  sprintf = require('sprintf');

function SvnReleaseSteps(config) {
  this.config = _.defaults(config, SVN_DEFAULTS);
  this.svn = new QSVN(config);
}

function noChangesInWorkingCopy() {

  this.svn.st().then(processSvnStatus);

  function processSvnStatus(svnStatus) {

    util.inherits(ChangesInWorkingCopyError, Error);

    if (!_.isEmpty(svnStatus)) {
      throw new ChangesInWorkingCopyError(svnStatus);
    }

    function ChangesInWorkingCopyError(svnStatus) {
      Error.call(this, _.reduce(svnStatus, function (accumulator, svnStatusRow) {
        return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
      }, 'changes in working copy detected: \n'), 'ChangesInWorkingCopyError');
    }
  }
}

SvnReleaseSteps.prototype.noChangesInWorkingCopy = noChangesInWorkingCopy;


function updateLocalVersion(version) {
  return this.noChangesInWorkingCopy()
    .then(readPackageJson())
    .then(updateVersion(version))
    .then(storePackageJson);
}

function readPackageJson() {
  return Q.nfbind(fs.readFile, './package.json', {encoding: this.config.encoding}).
    then(function (data) {
           return JSON.parse(data);
         }
  );
}

function storePackageJson() {
  return function (packageJson) {
    return Q.nfbind(fs.writeFile, './package.json', JSON.stringify(packageJson), {encoding: this.config.encoding});
  };
}

function updateVersion(version) {
  return function (packageJson) {
    packageJson.version = version;
    return packageJson;
  };
}

function commitFiles(message, files) {
  return Q.nbind(this.svn.ci, this.svn, files || [], message);
}


function tagWorkingCopy(target, message, callback) {
  svn.cp('.', target, message, callback);
}

function normalizedRepoUrl(args) {
  async.waterfall([
    fetchRepoInfo,
    toUrl,
    toPath,
  ], mainCallback);
}

function workingCopyRepoUrl(mainCallback) {
  async.waterfall([
    fetchRepoInfo,
    toUrl
  ], mainCallback);
}

function fetchRepoInfo(callback) {
  this.svn.info("", callback);
}

function toUrl(svnInfo, callback) {
  callback(null, svnInfo.url);
}

function revertLocalChanges() {

}

//function msg() {
//  return 'svn-release: ' + sprintf.apply(sprintf.sprintf, _.toArray(arguments));
//}

SvnReleaseSteps.prototype.updateLocalVersion = updateLocalVersion;

module.exports = SvnReleaseSteps;