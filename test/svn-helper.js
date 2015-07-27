"use strict";

var chai           = require('chai'),
    chaiSpies      = require('chai-spies'),
    chaiAsPromised = require("chai-as-promised"),
    SVN            = require('node.svn'),
    SvnHelper      = require('../lib/svn-helper'),
    expect         = chai.expect,
    svn            = new SVN('.');

chai.use(chaiAsPromised);
chai.use(chaiSpies);

describe('SvnHelper', function () {

  describe('#info()', function () {
    it('should call svn#info() handle', function () {
      var svnInfo       = chai.spy.on(svn, 'info'),
          svnHelperInfo = new SvnHelper(svn).info();

      return expect(svnHelperInfo()).to.eventually.be.rejected
        .then(function () {
                expect(svnInfo).to.have.been.called();
              });
    });
  });

  describe('#status()', function () {
    it('should call svn#status() handle', function () {
      var svnStatus       = chai.spy.on(svn, 'status'),
          svnHelperStatus = new SvnHelper(svn).status();

      return expect(svnHelperStatus()).to.eventually.be.rejected
        .then(function () {
                expect(svnStatus).to.have.been.called();
              });
    });
  });

  describe('#add()', function () {
    it('should call svn#run() handle with provided path arg', function () {
      var svnRun       = chai.spy.on(svn, 'run'),
          path         = 'foo',
          svnHelperAdd = new SvnHelper(svn).add(path);

      return expect(svnHelperAdd()).to.eventually.be.rejected
        .then(function () {
                expect(svnRun).to.have.been.called.with(
                  ['add', path, '--no-ignore']
                );
              });
    });
  });

  describe('#revert()', function () {
    it('should call svn#run() handle with revert args', function () {
      var svnRun          = chai.spy.on(svn, 'run'),
          svnHelperRevert = new SvnHelper(svn).revert();

      return expect(svnHelperRevert()).to.eventually.be.rejected
        .then(function () {
                expect(svnRun).to.have.been.called.with(
                  ['revert', '.', '--recursive']
                );
              });
    });
  });

  describe('#copy()', function () {
    it('should call svn#run() handle with copy source and target args', function () {
      var svnRun        = chai.spy.on(svn, 'run'),
          copyArgs      = {source: 'foo', target: 'bar'},
          svnHelperCopy = new SvnHelper(svn).copy(copyArgs);

      return expect(svnHelperCopy()).to.eventually.be.rejected
        .then(function () {
                expect(svnRun).to.have.been.called.with(
                  ['copy', copyArgs.source, copyArgs.target, '-m', 'svn-release']
                );
              });
    });
  });

  describe('#commit()', function () {
    it('should call svn#commit() handle with [] and "svn-release" args', function () {
      var svnCommit       = chai.spy.on(svn, 'commit'),
          svnHelperCommit = new SvnHelper(svn).commit();

      return expect(svnHelperCommit()).to.eventually.be.rejected
        .then(function () {
                expect(svnCommit).to.have.been.called.with(
                  [], 'svn-release'
                );
              });
    });
  });
});
