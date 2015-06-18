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
  q = require('q'),
  _ = require('lodash'),
  fs = require('fs'),
  util = require('util'),
  sprintf = require('sprintf');


function SvnReleaseSteps(optionalConfig) {

  var config = _.defaults(optionalConfig || {}, SVN_DEFAULTS),
    svn = new QSVN(config);

  this.updateWorkingCopyVersion = updateWorkingCopyVersion;
  this.noChangesInWorkingCopy = noChangesInWorkingCopy;
  this.tagWorkingCopy = tagWorkingCopy;

  function updateWorkingCopyVersion(version) {
    return readPackageJson()
      .put('version', version)
      .then(storePackageJson())
      .then(commit(['package.json'], msg("persisting working copy version: %s", version)))
      .done(onFinishedResolver('update-working-copy-version'));
  }

  function onFinishedResolver(command) {
    return function (resolve, reject) {
      if (reject) {
        console.log("svn-release: command [", command, "] failed");
        console.err("reason: ", reject);
      } else {
        console.log("svn-release: command [", command, "] completed");
        console.log("result: resolve");
      }
    };
  }


  function tagWorkingCopy(tagName) {

  }

  function noChangesInWorkingCopy() {

    return svn.st()
      .then(processSvnStatus);

    function processSvnStatus(svnStatus) {

      util.inherits(ChangesInWorkingCopyError, Error);

      if (!_.isEmpty(svnStatus)) {
        throw new ChangesInWorkingCopyError(svnStatus);
      }

      return q(); // jshint ignore:line

      function ChangesInWorkingCopyError(svnStatus) {
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = _.reduce(svnStatus, function (accumulator, svnStatusRow) {
          return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
        }, 'changes in working copy detected: \n');
      }
    }
  }

  function readPackageJson() {
    return function () {
      return q.nfcall(fs.readFile, 'package.json', config.fsOptions)
        .then(JSON.parse);
    };
  }

  function storePackageJson() {
    return function (packageJson) {
      return q.nfcall(fs.writeFile, 'package.json', JSON.stringify(packageJson), config.fsOptions);
    };
  }

  function updateVersion(version) {
    return function (packageJson) {
      packageJson.version = version;
      return packageJson;
    };
  }

  function commit(files, message) {
    return function () {
      return svn.ci(files, message);
    };
  }
}

function msg() {
  return 'svn-release: ' + sprintf.apply(sprintf.sprintf, _.toArray(arguments));
}

module.exports.SvnReleaseSteps = SvnReleaseSteps;