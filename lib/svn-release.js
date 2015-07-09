"use strict";

var logger    = require('npmlog'),
    fs        = require('fs'),
    qfs       = require('q-io/fs'),
    QSVN      = require('./q-svn'),
    _         = require('lodash');

logger['enableColor']();
logger.stream = process.stdout;

module.exports = SvnRelease;

function SvnRelease(cwd) {

  var svn         = new QSVN(cwd || '.'),
      packageJson = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8')),
      svnRelease  = this;

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
      logger.error('svn-release', 'release failure:', failure);
      return svn.revert('.', '--recursive')
        .thenReject(failure);
    };
  };

  this.onError = function (error) {
    logger.error('svn-release', 'procedure failed with:', error);
    throw error;
  };

  this.info = function () {
    return function () {
      return svn.info();
    };
  };
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

  logger.log('info', 'svn-release', 'branch procedure executed with: %j', options);

  return this.synced()
    .then(this.handleDefaultProcedure(options.branches,
                                      options.branchName,
                                      options.branchVersion,
                                      options.nextVersion))
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

  logger.log('info', 'svn-release', 'release procedure executed with: %j', options);

  var handle = options.dist ?
               this.handleDistProcedure(options.releases,
                                        options.releaseName,
                                        options.releaseVersion,
                                        options.nextVersion,
                                        options.dist) :
               this.handleDefaultProcedure(options.releases,
                                           options.releaseName,
                                           options.releaseVersion,
                                           options.nextVersion);

  return this.synced()
    .then(handle)
    .catch(this.onError);
};