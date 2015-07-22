'use strict';

var assert = require("assert"),
    QSVN   = require("../lib/q-svn"),
    qSvn   = new QSVN('.');

describe('QSVN', function () {
  describe('#propset', function () {
    it('should be a defined function', function () {
      assert.equal(typeof(qSvn.svn.revert), "function", "xx");
    });
  });
});