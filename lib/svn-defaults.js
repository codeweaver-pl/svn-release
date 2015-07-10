"use strict";

/**
 * Constructs SvnDefaults
 * @param {!string} currentVersion Application's current version
 * @class
 */

var semver = require('semver'),
    _      = require('lodash');

function SvnDefaults(currentVersion) {
  this.currentVersion = currentVersion;
}

SvnDefaults.prototype = Object.create(Object.prototype, {
  branchName:         {
    get: function () {
      return semver.major(this.currentVersion) + '.' + semver.minor(this.currentVersion);
    }
  },
  branchVersion:      {
    get: function () {
      return this.currentVersion;
    }
  },
  releaseName:        {
    get: function () {
      return this.currentVersion;
    }
  },
  releaseVersion:     {
    get: function () {
      return this.currentVersion;
    }
  },
  postReleaseVersion: {
    get: function () {
      return semver.inc(this.currentVersion, 'patch');
    }
  },
  postBranchVersion:  {
    get: function () {
      return semver.inc(this.currentVersion, 'minor');
    }
  }
});

SvnDefaults.prototype.branchOptions = function (overrides) {
  return _.extend({
    branchName:    this.branchName,
    branchVersion: this.branchVersion,
    nextVersion:   this.postBranchVersion,
    branches:      'branches'
  }, objectOrEmpty(overrides));
};

SvnDefaults.prototype.releaseOptions = function (overrides) {
  return _.extend({
    releaseName:    this.releaseName,
    releaseVersion: this.releaseVersion,
    nextVersion:    this.postReleaseVersion,
    releases:       'tags',
    dist:           null
  }, objectOrEmpty(overrides));
};

function objectOrEmpty(value) {
  return _.isObject(value) ? value : {};
}

module.exports = SvnDefaults;