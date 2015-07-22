"use strict";

var fs          = require('fs'),
    qfs         = require('q-io/fs'),
    QSVN        = require('./q-svn'),
    SvnDefaults = require('./svn-defaults'),
    logger      = require('./svn-logger'),
    _           = require('lodash');

module.exports = SvnRelease;

/**
 * @typedef {object} SvnReleaseConfig
 * @property {!string} cwd Current working directory
 * @property {?string} username SVN username
 * @property {?string} password SVN password
 * @property {?string} defaultMessage default SVN interaction message
 */

/**
 * @param {string|SvnReleaseConfig} config
 * @constructor
 */
function SvnRelease(config) {

  var configObject = asConfigObject(config),
      svn          = new QSVN(configObject),
      packageJson  = JSON.parse(fs.readFileSync(configObject.cwd + '/package.json', 'utf8'));

  /**
   * Execute dist procedure
   *
   * @param parentPath Relative path to subversion's target parent folder
   * @param targetName Target folder name
   * @param targetVersion Target version
   * @param nextVersion Next working copy version
   * @param distPath distribution folder path
   * @returns {Promise}
   * @api private
   */
  this.handleDistProcedure = function (parentPath, targetName, targetVersion, nextVersion, distPath) {
    return function () {
      return updateVersion(targetVersion)()
        .then(svnCommit())
        .then(svnGetIgnore())
        .then(allRowsExcept(distPath))
        .then(svnSetIgnore())
        .then(svnAdd(distPath))
        .then(svnInfo())
        .then(copy({
                source:     '.',
                parentPath: parentPath,
                targetName: targetName
              }))
        .then(svnRevert())
        .then(updateVersion(nextVersion))
        .then(svnCommit())
        .catch(onFailure());
    };
  };

  /**
   * Execute default, non-dist procedure
   *
   * @param parentPath Relative path to subversion's target parent folder
   * @param targetName Target folder name
   * @param targetVersion Target version
   * @param nextVersion Next working copy version
   * @returns {Promise}
   * @api private
   */
  this.handleDefaultProcedure = function (parentPath, targetName, targetVersion, nextVersion) {
    return function () {
      return updateVersion(targetVersion)()
        .then(svnCommit())
        .then(svnInfo())
        .then(copy({
                targetName: targetName,
                parentPath: parentPath
              }))
        .then(updateVersion(nextVersion))
        .then(svnCommit())
        .catch(onFailure());
    };
  };

  this.onError = function (error) {
    logger.error('procedure failed with:', error);
    throw error;
  };

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

  function copy(copyParamsOverrides) {
    return function (repoInfo) {

      var copyOptions = _.extend({
        repoUrl: repoInfo['url'],
        source:  repoInfo['url']
      }, copyParamsOverrides);

      return svn.copy(
        copyOptions.source,
        target(copyOptions)
      );

      function target(copyOpts) {
        return [
          repoRoot(),
          copyOpts.parentPath,
          copyOpts.targetName
        ].join('/');

        function repoRoot() {
          return _.chain(['/trunk', '/branches', '/tags'])
            .reduce(pathBefore, copyOpts.repoUrl)
            .value();

          function pathBefore(path, splitOn) {
            return path.split(splitOn)
              .shift();
          }
        }
      }
    };
  }

  function svnRevert() {
    return function () {
      return svn.revert('.', '--recursive');
    };
  }

  function svnInfo() {
    return function () {
      return svn.info();
    };
  }

  function svnGetIgnore() {
    return function () {
      return svn.propget('svn:ignore', '.');
    };
  }

  function svnSetIgnore() {
    return function (ignores) {
      return svn.propset('svn:ignore', ignores.join('\n'), '.');
    };
  }

  function svnCommit() {
    return function () {
      return svn.commit([]);
    };
  }

  function svnAdd(dirname) {
    return function () {
      return svn.add(dirname);
    };
  }

  function allRowsExcept(ignoreEntry) {
    return function (ignores) {
      return _.chain(ignores.split('\n'))
        .map(_.trim)
        .without(ignoreEntry)
        .value();
    };
  }

  function onFailure() {
    return function (failure) {
      logger.error('release failure:', failure);
      return svn.revert('.', '--recursive')
        .thenReject(failure);
    };
  }

  function updateVersion(version) {
    return function () {
      packageJson.version = version;
      return qfs.write('package.json', JSON.stringify(packageJson, null, 2));
    };
  }

  /**
   * @param {string|SvnReleaseConfig} data
   * @returns SvnReleaseConfig
   */
  function asConfigObject(data) {

    var minConfig = {cwd: '.', defaultMessage: 'svn-release'};

    return _.isString(data) ? fromObject({cwd: data}) :
           _.isObject(data) ? fromObject(data) :
           _.isUndefined(data) ? minConfig : null;

    function fromObject(dataObject) {
      return _.chain(dataObject)
        .pick('cwd', 'username', 'password', 'defaultMessage')
        .defaults(minConfig)
        .omit(_.isEmpty)
        .value();
    }
  }
}
/**
 * A setup object for branching procedure
 * @typedef {Object} BranchOptions
 * @property {!string} branchName
 * @property {!string} branchVersion
 * @property {!string} nextVersion
 * @property {!string} branches
 *
 * Execute branch procedure
 * @param {!BranchOptions} options
 * @returns {Q.Promise}
 * @api public
 */
SvnRelease.prototype.branch = function (options) {

  var bOpts = _.pick(options, ['branches', 'branchName', 'branchVersion', 'nextVersion']);

  logger.info('branch procedure executed with:', JSON.stringify(bOpts));

  return this.synced()
    .then(this.handleDefaultProcedure(bOpts.branches,
                                      bOpts.branchName,
                                      bOpts.branchVersion,
                                      bOpts.nextVersion))
    .catch(this.onError);
};

/**
 * A setup object for release procedure
 * @typedef {Object} ReleaseOptions
 * @property {!string} releaseName
 * @property {!string} releaseVersion
 * @property {!string} nextVersion
 * @property {!string} releases
 * @property {?string} dist
 *
 *
 * Execute release procedure
 * @param {ReleaseOptions} options
 * @returns {Q.Promise}
 * @api public
 */
SvnRelease.prototype.release = function (options) {

  var rOpts = _.pick(options, ['releases', 'releaseName', 'releaseVersion', 'nextVersion', 'dist']);

  logger.info('release procedure executed with:', JSON.stringify(rOpts));

  var handle = options.dist ?
               this.handleDistProcedure(rOpts.releases,
                                        rOpts.releaseName,
                                        rOpts.releaseVersion,
                                        rOpts.nextVersion,
                                        rOpts.dist) :
               this.handleDefaultProcedure(rOpts.releases,
                                           rOpts.releaseName,
                                           rOpts.releaseVersion,
                                           rOpts.nextVersion);

  return this.synced()
    .then(handle)
    .catch(this.onError);
};

SvnRelease.SvnDefaults = SvnDefaults;