'use strict';

var assert = require("assert"),
    SvnRelease = require("../lib/svn-release"),
    svnRelease = new SvnRelease('.');

describe('SvnRelease', function () {
  describe('x', function () {
    it('x', function () {
      assert.equal(true, false, "msg");
    });
  });
});