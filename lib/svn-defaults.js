"use strict";

/**
 * Constructs SvnDefaults
 * @param {!string} currentVersion Application's current version
 * @class
 */

var semver      = require('semver'),
    /** @type {RegExp} */
    semverRegex = require('semver-regex')(),
    _           = require('lodash');

/**
 * @param {string} currentVersion
 * @constructor
 */
function SvnDefaults(currentVersion) {

  if (!semverRegex.test(currentVersion)) {
    throw new Error('provided argument:', currentVersion, ' is not valid (has to match semver specs)');
  }
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
  }, objectOr(overrides, {}));
};

SvnDefaults.prototype.releaseOptions = function (overrides) {
  return _.extend({
    releaseName:    this.releaseName,
    releaseVersion: this.releaseVersion,
    nextVersion:    this.postReleaseVersion,
    releases:       'tags',
    dist:           null
  }, objectOr(overrides, {}));
};

function objectOr(value, or) {
  return _.isObject(value) ? value : or;
}

module.exports = SvnDefaults;