"use strict";

var _ = require('lodash'),
    Q = require('q');

function SvnHelper(svn) {
  this.svn = svn;
}

_.extend(SvnHelper.prototype, {
  info:   function () {
    var infoHandle = Q.nbind(this.svn.info, this.svn);
    return function () {
      return infoHandle();
    };
  },
  status: function () {
    var statusHandle = Q.nbind(this.svn.status, this.svn);
    return function () {
      return statusHandle();
    };
  },
  add:    function (path) {
    var addHandle = Q.nbind(this.svn.run, this.svn, ['add', path, '--no-ignore']);
    return function () {
      return addHandle();
    };
  },
  commit: function () {
    var commitHandle = Q.nbind(this.svn.commit, this.svn, [], 'svn-release');
    return function () {
      return commitHandle();
    };
  },
  copy:   function (copyArgs) {
    var copyHandle = Q.nbind(this.svn.run, this.svn, ['copy', copyArgs.source, copyArgs.target, '-m', 'svn-release']);
    return function () {
      return copyHandle();
    };
  },
  revert: function () {
    var revertHandle = Q.nbind(this.svn.run, this.svn, ['revert', '.', '--recursive']);
    return function () {
      return revertHandle();
    };
  }
});

module.exports = SvnHelper;