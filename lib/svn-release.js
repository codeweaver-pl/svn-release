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
        .then(svnRelease.withoutDistPath(distPath))
        .then(svnRelease.ignore())
        .then(svnRelease.add(distPath))
        .then(svnRelease.info())
        .then(svnRelease.tap)
        .get('url')
        .then(svnRelease.tap)
        .then(svnRelease.repoUrl())
        .then(svnRelease.tap)
        .put('source', '.')
        .then(svnRelease.tap)
        .put('parentPath', parentPath)
        .then(svnRelease.tap)
        .put('targetName', targetName)
        .then(svnRelease.tap)
        .then(svnRelease.copy())
        .then(svnRelease.revert())
        .then(svnRelease.version(nextVersion))
        .then(svnRelease.commit())
        .fail(svnRelease.onFailure());
    };
  };

  this.repoUrl = function () {
    return function (repoUrl) {
      return {repoUrl: repoUrl, source: repoUrl};
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
          .get('url')
          .then(svnRelease.repoUrl())
          .then(svnRelease.repoRoot())
          .then(svnRelease.source())
          .then(svnRelease.target(targetName, parentPath))
          .then(svnRelease.copy())
          .then(svnRelease.version(nextVersion))
          .then(svnRelease.commit())
          .fail(svnRelease.onFailure());
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
        return svn.commit(
          [],
          'svn-release'
        );
      };
    };

    this.copy = function () {
      return function (copyOptions) {
        return svn.copy(
          copyOptions.source,
          target(),
          'svn-release'
        );

        function target() {
          function repoRoot() {
            return _.reduce(
              ['/trunk', '/branches', '/tags'],
              pathBefore,
              copyOptions.repoUrl
            );
          }

          function pathBefore(path, before) {
            return path.split(before)[0];
          }

          return [
            repoRoot(),
            copyOptions.parentPath,
            copyOptions.targetName
          ].join('/');
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

  this.withoutDistPath = function (distPath) {
    return function (ignores) {
      return _.chain(ignores.split('\n'))
        .map(_.trim)
        .without(distPath)
        .value();
    };
  };

  this.tap = function(data) {
    console.log(data);
    return data;
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
                                      options.nextVersion),
          this.onError);
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
    .then(handle, this.onError);
};