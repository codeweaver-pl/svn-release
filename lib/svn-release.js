"use strict";

var fs          = require('fs'),
    qfs         = require('q-io/fs'),
    QSVN        = require('./q-svn'),
    SvnDefaults = require('./svn-defaults'),
    logger      = require('./svn-logger'),
    _           = require('lodash');

module.exports = SvnRelease;

function SvnRelease(config) {

  var configObject = asConfigObject(config),
      svn          = new QSVN(configObject),
      packageJson  = JSON.parse(fs.readFileSync(configObject.cwd + '/package.json', 'utf8')),
      svnRelease   = this;

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
      return svnRelease.version(targetVersion)()
        .then(svnRelease.commit())
        .then(svnRelease.ignored())
        .then(svnRelease.removeIgnoreEntry(distPath))
        .then(svnRelease.ignore())
        .then(svnRelease.add(distPath))
        .then(svnRelease.info())
        .then(svnRelease.copy({
                source:     '.',
                parentPath: parentPath,
                targetName: targetName
              }))
        .then(svnRelease.revert())
        .then(svnRelease.version(nextVersion))
        .then(svnRelease.commit())
        .catch(svnRelease.onFailure());
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
      return svnRelease.version(targetVersion)()
        .then(svnRelease.commit())
        .then(svnRelease.info())
        .then(svnRelease.copy({
                targetName: targetName,
                parentPath: parentPath
              }))
        .then(svnRelease.version(nextVersion))
        .then(svnRelease.commit())
        .catch(svnRelease.onFailure());
    };
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

  this.version = function (version) {
    return function () {
      packageJson.version = version;
      return qfs.write('package.json', JSON.stringify(packageJson, null, 2));
    };
  };

  this.commit = function () {
    return function () {
      return svn.commit([], 'svn-release');
    };
  };

  this.copy = function (copyParamsOverrides) {
    return function (repoInfo) {

      var copyOptions = _.extend({
        repoUrl: repoInfo['url'],
        source:  repoInfo['url']
      }, copyParamsOverrides);

      return svn.copy(
        copyOptions.source,
        target(copyOptions),
        'svn-release'
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
  };

  this.revert = function () {
    return function () {
      return svn.revert('.', '--recursive');
    };
  };

  this.ignored = function () {
    return function () {
      return svn.propget('svn:ignore', '.');
    };
  };

  this.ignore = function () {
    return function (ignores) {
      return svn.propset('svn:ignore', ignores.join('\n'), '.');
    };
  };

  this.add = function (dirname) {
    return function () {
      return svn.add(dirname);
    };
  };

  this.removeIgnoreEntry = function (ignoreEntry) {
    return function (ignores) {
      return _.chain(ignores.split('\n'))
        .map(_.trim)
        .without(ignoreEntry)
        .value();
    };
  };

  this.onFailure = function () {
    return function (failure) {
      logger.error('release failure:', failure);
      return svn.revert('.', '--recursive')
        .thenReject(failure);
    };
  };

  this.onError = function (error) {
    logger.error('procedure failed with:', error);
    throw error;
  };

  this.info = function () {
    return function () {
      return svn.info();
    };
  };

  function asConfigObject(data) {

    var minConfig = {cwd: '.'};

    return _.isString(data) ? {cwd: data} :
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
 * @returns {Promise}
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
 * @returns {Promise}
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