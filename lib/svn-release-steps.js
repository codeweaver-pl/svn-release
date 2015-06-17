"use strict";
(function () {

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
    SVN = require('./node.svn-extended'),
    _ = require('lodash'),
    sprintf = require('sprintf');

  function SvnReleaseSteps(config) {
    this.config = _.defaults(config, SVN_DEFAULTS);
    this.svn = new SVN(config);
    this.steps = [];
  }

  SvnReleaseSteps.prototype.noChangesInWorkingCopy = noChangesInWorkingCopy;
  SvnReleaseSteps.prototype.setVersion = setVersion;
  SvnReleaseSteps.prototype.tagWorkingCopy = tagWorkingCopy;
  SvnReleaseSteps.prototype.normalizedRepoUrl = normalizedRepoUrl;
  SvnReleaseSteps.prototype.workingCopyRepoUrl = workingCopyRepoUrl;
  SvnReleaseSteps.prototype.revertLocalChanges = revertLocalChanges;


  module.exports = SvnReleaseSteps;

  function noChangesInWorkingCopy(callback) {

    async.waterfall([
      this.svn.st,
      processSvnStatus
    ], callback);

    function processSvnStatus(svnStatus, callback) {

      function ChangesInWorkingCopyError(svnStatus) {
        Error.call(this, _.reduce(svnStatus, function (accumulator, svnStatusRow) {
          return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
        }, 'changes in working copy detected: \n'), 'ChangesInWorkingCopyError');
      }

      ChangesInWorkingCopyError.prototype = Object.create(Error.prototype);

      _.isEmpty(svnStatus) ? callback() : callback(new ChangesInWorkingCopyError(svnStatus));
    }
  }

  function setVersionStep(version) {

    return async.compose(
      readPackageJsonStep,
      function (packageJson, callback) {
        packageJson.version = version;
        callback(null, packageJson);
      },
      storePackageJsonStep,
      commitStep("storing current working copy version: %s", version));
  }

  function readPackageJsonStep() {
    return async.compose(
      _.bind(fs.readFile, this, './package.json', {encoding: this.config.encoding}),
      function (data, callback) {
        callback(null, JSON.parse(data));
      }
    );
  }

  function storePackageJsonStep() {
    return function (packageJson, callback) {
      var data = _.isObject(packageJson) ? JSON.stringify(packageJson, null, '  ') : packageJson;
      fs.writeFile('./package.json', data, {encoding: this.config.encoding}, callback);
    }
  }

  function commitStep(message) {
    return _.bind(svn.ci, [], message);
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

  function msg() {
    return 'svn-release: ' + sprintf.apply(sprintf.sprintf, _.toArray(arguments));
  }
})
();