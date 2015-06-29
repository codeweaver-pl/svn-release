"use strict";

var qfs    = require('q-io/fs'),
    fs     = require('fs'),
    log    = require('npmlog'),
    _      = require('lodash'),
    QSVN   = require('q-svn');

log['enableColor']();
log.stream = process.stdout;

module.exports = SvnRelease;

function SvnRelease(cwd) {

  var svn         = new QSVN(cwd || '.'),
      packageJson = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8'));

  this.synced = function() {
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

  this.version = function(version) {
    return function() {
      packageJson.version = version;
      return qfs.write('package.json', JSON.stringify(packageJson, null, 2));
    };
  };

  this.commit = function() {
    return function() {
      return svn.commit([], 'svn-release');
    };
  };

  this.copy = function(branches, branchName) {
    return function() {
      return svn.info()
        .then(copy);

      function copy(info) {
        return svn.copy(
          info['url'],
          [info['repositoryroot'], branches, branchName].join('/'),
          'svn-release'
        );
      }
    };
  };

  this.revert = function() {
    return function() {
      return svn.revert('.', '--recursive');
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
 */
SvnRelease.prototype.branch = function(options) {

  log.info('svn-release', 'branch procedure executed with: %j', options);

  var mod = this;

  return mod.synced()
    .then(doBranch, onError);

  function doBranch() {

    return mod.version(options.branchVersion)()
      .then(mod.commit())
      .then(mod.copy(options.branches, options.branchName))
      .then(mod.version(options.nextVersion))
      .then(mod.commit())
      .fail(function(error) {
              onError(error);
              mod.revert();
            });
  }
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
 */
SvnRelease.prototype.release = function(options) {

  log.info('svn-release', 'release procedure executed with: %j', options);

  var mod = this;

  return mod.synced()
    .then(doRelease, onError);

  function doDistRelease() {

    log.info('svn-release', 'distribution release (includes %s)', options.dist);

    return mod.version(options.releaseVersion)()
      .then(mod.commit())
      .then(mod.copy(options.releases, options.releaseName))
      .then(mod.version(options.nextVersion))
      .then(mod.commit())
      .fail(function(error) {
              onError(error);
              mod.revert();
            });
  }

  function doDefaultRelease() {

    log.info('svn-release', 'default release');

    return mod.version(options.releaseVersion)()
      .then(mod.commit())
      .then(mod.copy(options.releases, options.releaseName))
      .then(mod.version(options.nextVersion))
      .then(mod.commit())
      .fail(function(error) {
              onError(error);
              mod.revert();
            });
  }

  function doRelease() {
    return options.dist ? doDistRelease() : doDefaultRelease();
  }
};

function onError(error) {

  log.error('svn-release', 'procedure failed with:', error);
}