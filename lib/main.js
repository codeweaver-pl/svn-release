"use strict";

var SVN_DEFAULTS = {
    cwd: '.',
    paths: {
      trunk: 'trunk',
      branches: 'branches',
      tags: 'tags'
    },
    fsOptions: {encoding: 'utf-8'}
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

      return Q();

      function ChangesInWorkingCopyError(svnStatus) {
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = _.reduce(svnStatus, function (accumulator, svnStatusRow) {
          return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
        }, 'changes in working copy detected: \n');
      }
    }
  }

  function updateLocalVersion(version) {
    return noChangesInWorkingCopy()
      .then(readPackageJson())
      .then(updateVersion(version))
      .then(storePackageJson())
  }

  function readPackageJson() {
    return function () {
      return Q.nfcall(fs.readFile, 'package.json', config.fsOptions)
        .then(JSON.parse)
    }
  }

  function storePackageJson() {
    return function (packageJson) {
      return Q.nfcall(fs.writeFile, 'package.json', JSON.stringify(packageJson), config.fsOptions);
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