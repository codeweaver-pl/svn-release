"use strict";

var fs          = require('fs'),
    qfs         = require('q-io/fs'),
    Svn = require('node.svn'),
    SvnDefaults = require('./svn-defaults'),
    SvnHelper   = require('./svn-helper'),
    logger      = require('./svn-logger'),
    _           = require('lodash');

module.exports = SvnRelease;

/**
 * @typedef {object} SvnReleaseConfig
 * @property {!string} cwd Current working directory
 * @property {?string} username SVN username
 * @property {?string} password SVN password
 */

/**
 * @param {string|SvnReleaseConfig} config
 * @constructor
 */
function SvnRelease(config) {

  var configObject = normalizeConfig(config),
      svnHelper    = new SvnHelper(new Svn(configObject)),
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
        .then(svnHelper.commit())
        .then(svnHelper.add(distPath))
        .then(svnHelper.info())
        .then(copy({
                source:     '.',
                parentPath: parentPath,
                targetName: targetName
              }))
        .then(svnHelper.revert())
        .then(updateVersion(nextVersion))
        .then(svnHelper.commit())
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
        .then(svnHelper.commit())
        .then(svnHelper.info())
        .then(copy({
                targetName: targetName,
                parentPath: parentPath
              }))
        .then(updateVersion(nextVersion))
        .then(svnHelper.commit())
        .catch(onFailure());
    };
  };

  this.onError = function (error) {
    logger.error('procedure failed with:', error);
    throw error;
  };

  this.synced = function () {
    return svnHelper.status()()
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

      return svnHelper.copy({
        source: copyOptions.source,
        target: target(copyOptions)
      })();

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

  function onFailure() {
    return function (failure) {
      logger.error('release failure:', failure);
      return svnHelper.revert()()
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
  function normalizeConfig(data) {

    var minConfig = {cwd: '.'};

    return _.isString(data) ? fromObject({cwd: data}) :
           _.isObject(data) ? fromObject(data) :
           _.isUndefined(data) ? minConfig : null;

    function fromObject(dataObject) {
      return _.chain(dataObject)
        .pick('cwd', 'username', 'password')
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