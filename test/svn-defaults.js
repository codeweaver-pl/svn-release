'use strict';

var expect      = require("chai").expect,
    SvnDefaults = require("../lib/svn-release").SvnDefaults;

describe('SvnDefaults', function () {

  describe('#constructor()', function () {

    it('should only accept semver compliant argument', function () {

      expect(function () {
        return new SvnDefaults('1.2.3');
      }).to.not.throw(Error);

      expect(function () {
        return new SvnDefaults('abc-def');
      }).to.throw(Error);
    });
  });

  describe('#branchName', function () {

    it('should return major-minor for current version', function () {
      var svnDefaults = new SvnDefaults('1.2.3');
      expect(svnDefaults.branchName).to.equal('1.2');
    });
  });

  describe('#branchVersion()', function () {});
  describe('#releaseName()', function () {});
  describe('#releaseVersion()', function () {});
  describe('#postReleaseVersion()', function () {});
  describe('#postBranchVersion()', function () {});
  describe('#branchOptions()', function () {});
  describe('#releaseOptions()', function () {});
});