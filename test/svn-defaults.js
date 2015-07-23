'use strict';

var expect      = require('chai').expect,
    SvnDefaults = require('../lib/svn-release').SvnDefaults,
    svnDefaults = new SvnDefaults('1.2.3');

describe('SvnDefaults', function () {

  describe('#constructor()', function () {
    it('should only accept semver compliant argument', function () {
      expect(function () {
        return new SvnDefaults('abc-def');
      }).to.throw(Error);
    });
  });

  describe('#branchName', function () {

    it('should return major-minor for current version', function () {
      expect(svnDefaults.branchName).to.equal('1.2');
    });
  });

  describe('#branchVersion', function () {
    it('should return current version', function () {
      expect(svnDefaults.branchVersion).to.equal('1.2.3');
    });
  });

  describe('#releaseName', function () {
    it('should return current version', function () {
      expect(svnDefaults.releaseName).to.equal('1.2.3');
    });
  });

  describe('#releaseVersion', function () {
    it('should return current version', function () {
      expect(svnDefaults.releaseVersion).to.equal('1.2.3');
    });
  });

  describe('#postReleaseVersion', function () {
    it('should return patch bump of current version', function () {
      expect(svnDefaults.postReleaseVersion).to.equal('1.2.4');
    });
  });

  describe('#postBranchVersion', function () {
    it('should return minor bump of current version', function () {
      expect(svnDefaults.postBranchVersion).to.equal('1.3.0');
    });
  });

  describe('#branchOptions()', function () {
    it('should return current version', function () {
      expect(svnDefaults.branchOptions()).to.deep.equal({
          branchName:    '1.2',
          branchVersion: '1.2.3',
          branches:      'branches',
          nextVersion:   '1.3.0'
        }
      );
    });
  });

  describe('#releaseOptions()', function () {
    it('should return current version', function () {
      expect(svnDefaults.releaseOptions()).to.deep.equal({
        dist:           null,
        nextVersion:    '1.2.4',
        releaseName:    '1.2.3',
        releaseVersion: '1.2.3',
        releases:       'tags'
      });
    });
  });
});