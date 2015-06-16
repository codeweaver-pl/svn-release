"use strict";

var semver = require('semver'),
  SVN = require('./node.svn-extended'),
  svn = new SVN(new BranchConfig()),
  _ = require('lodash'),
  packageJson = require('../package.json'),
  currentVersion = packageJson.version;

function BranchConfig(encodingParam, branchVersionParam, developmentVersionParam, branchName) {
  this.cwd = '.';
  this.encoding = function () {return _.isEmpty(encodingParam) ? 'utf-8' : encodingParam};
  this.username = argv.username ? argv.username : this.username;
  this.password = argv.password ? argv.password : this.password;
  this.branchVersion = function () {
    return _.isEmpty(branchVersionParam) ? currentVersion : branchVersionParam;
  };
  this.developmentVersion = function () {
    return _.isEmpty(developmentVersionParam) ? semver.inc(currentVersion, 'minor') : developmentVersionParam;
  };
  this.branchName = function () {
    return _.isEmpty(branchName) ? this.branchVersion() : branchName;
  }
}

module.exports = {
  hasChanges: hasChanges,
  BranchConfig: BranchConfig,
  setVersion: setVersion,
  tagWorkingCopy: tagWorkingCopy,
  normalizedRepoRoot: normalizedRepoRoot,
  revertLocalChanges: revertLocalChanges
};

function hasChanges(callback) {
  async.waterfall([
    svn.st,
    processSvnStatus
  ], callback);

  function processSvnStatus(svnStatus, callback) {

    function ChangesInWorkingCopyError(svnStatus) {
      this.call(_.reduce(svnStatus, function (accumulator, svnStatusRow) {
        return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
      }, 'changes in working copy detected: \n'), 'ChangesInWorkingCopyError');
    }

    ChangesInWorkingCopyError.prototype = Object.create(Error.prototype);
    _.isEmpty(svnStatus) ? callback() : callback(new ChangesInWorkingCopyError(svnStatus));
  }
}

function setVersion(newVersion, message) {
  return function (mainCallback) {
    packageJson.version = newVersion;
    async.series([
        storePackageJson,
        commitPackageJson
      ],
      mainCallback);
  };

  function storePackageJson(callback) {
    fs.writeFile('./package.json', JSON.stringify(packageJson, null, '  '), {encoding: encoding()}, callback);
  }

  function commitPackageJson(callback) {
    svn.ci([], message, callback)
  }
}

function tagWorkingCopy(target, message, callback) {
  svn.cp('.', target, message, callback);
}

function normalizedRepoRoot(args) {
  return /(.*)\/$/.exec(
      packageJson.repository.url
        .split("/trunk")[0]
        .split('/branches')[0]
        .split('/tags')[0])[1] + '/' +
    _.toArray(arguments).splice(1).join('/');
}