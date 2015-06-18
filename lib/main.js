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
  QSVN = require('./q-svn'),
  Q = require('q'),
  _ = require('lodash'),
  fs = require('fs'),
  util = require('util'),
  sprintf = require('sprintf');

function SvnReleaseSteps(optionalConfig) {

  var config = _.defaults(optionalConfig || {}, SVN_DEFAULTS);
  var svn = new QSVN(config);
  this.noChangesInWorkingCopy = noChangesInWorkingCopy;
  this.updateLocalVersion = updateLocalVersion;

  function noChangesInWorkingCopy() {

    return svn.st()
      .then(processSvnStatus);

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

  function updateLocalVersion(version) {
    return noChangesInWorkingCopy()
      .then(readPackageJson())
      .then(updateVersion(version))
      .then(storePackageJson)
      .fail(console.log)
  }

  function readPackageJson() {
    return Q.nfcall(fs.readFile, './package.json', {encoding: config.encoding})
      .then(JSON.parse);
  }

  function storePackageJson() {
    return function (packageJson) {
      return Q.nfbind(fs.writeFile, './package.json', JSON.stringify(packageJson), {encoding: config.encoding});
    };
  }

  function updateVersion(version) {
    return function (packageJson) {
      packageJson.version = version;
      return packageJson;
    };
  }
}


module.exports.SvnReleaseSteps = SvnReleaseSteps;



