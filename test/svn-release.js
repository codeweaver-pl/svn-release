'use strict';

var _              = require('lodash'),
    chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    Q              = require('q'),
    SvnRelease     = require('../lib/svn-release'),
    expect         = chai.expect,
    svnRelease,
    svnHandle;

chai.use(chaiAsPromised);

describe('SvnRelease', function () {

  describe('#release()', function () {

    var releaseOpts = {
      releases:       'tags',
      releaseName:    '1.1.2',
      nextVersion:    '1.1.3',
      releaseVersion: '1.1.2',
      dist:           'dist'
    };

    beforeEach(function () {

      svnHandle = {
        status: function (cb) {
          cb(null, [
            {status: 'M', path: 'a-modified-file'},
            {status: 'D', path: 'a-deleted-file'}
          ]);
        }
      };

      svnRelease = new SvnRelease('.', svnHandle);
    });

    it('should crash ', function () {

      return expect(svnRelease.release(releaseOpts)).to.eventually.be.rejected
        .then(function (err) {
                expect(err).to.be.an.instanceof(Error);
              });
    });
  });
});