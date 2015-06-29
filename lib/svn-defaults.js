"use strict";

/**
 * Constructs SvnDefaults
 * @param {!string} currentVersion Application's current version
 * @class
 */

var semver = require('semver');

function SvnDefaults(currentVersion) {
  this.currentVersion = currentVersion;
}

SvnDefaults.prototype = Object.create(Object.prototype, {
  branchName:         {
    get: function() {
      return semver.major(this.currentVersion) + '.' + semver.minor(this.currentVersion);
    }
  },
  branchVersion:      {
    get: function() {
      return this.currentVersion;
    }
  },
  releaseName:        {
    get: function() {
      return this.currentVersion;
    }
  },
  releaseVersion:     {
    get: function() {
      return this.currentVersion;
    }
  },
  postReleaseVersion: {
    get: function() {
      return semver.inc(this.currentVersion, 'patch');
    }
  },
  postBranchVersion:  {
    get: function() {
      return semver.inc(this.currentVersion, 'minor');
    }
  },
  /** @type {BranchOptions} */
  branchOptions:      {
    get: function() {
      return {
        branchName:    this.branchName,
        branchVersion: this.branchVersion,
        nextVersion:   this.postBranchVersion,
        branches:      'branches'
      }
    }
  },
  /** @type {ReleaseOptions} */
  releaseOptions:     {
    get: function() {
      return {
        releaseName:    this.releaseName,
        releaseVersion: this.releaseVersion,
        nextVersion:    this.postReleaseVersion,
        releases:       'tags',
        dist:           null
      }
    }
  }
});

module.exports = SvnDefaults;