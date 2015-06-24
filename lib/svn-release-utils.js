"use strict";

var util = require('util'),
  q = require('q'),
  _ = require('lodash');

function SvnReleaseUtils(svn) {
  this.svn = svn;
}

SvnReleaseUtils.prototype.noLocalChanges = function () {

  return this.svn.st()
    .then(processSvnStatus);

  function processSvnStatus(svnStatus) {

    util.inherits(ChangesInWorkingCopyError, Error);

    if (_.any(svnStatus, isChange)) {
      throw new ChangesInWorkingCopyError(svnStatus);
    }

    return q();

    function ChangesInWorkingCopyError(svnStatus) {

      Error.captureStackTrace(this, this.constructor);

      this.name = this.constructor.name;
      this.message = _.reduce(_.filter(svnStatus, isChange), joinChanges, 'changes in working copy detected: \n');

      function joinChanges(accumulator, svnStatusRow) {
        return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
      }
    }

    function isChange(statusRow) {
      return statusRow.status !== '?';
    }
  }
};

module.exports = SvnReleaseUtils;