"use strict";

var util = require('util'),
  q = require('q');

function SvnReleaseUtils(svn) {
  this.svn = svn;
}

SvnReleaseUtils.prototype.noLocalChanges = function () {

  return this.svn.st()
    .then(processSvnStatus);

  function processSvnStatus(svnStatus) {

    util.inherits(ChangesInWorkingCopyError, Error);

    if (!_.isEmpty(svnStatus)) {
      throw new ChangesInWorkingCopyError(svnStatus);
    }

    return q();

    function ChangesInWorkingCopyError(svnStatus) {
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.message = _.reduce(svnStatus, function (accumulator, svnStatusRow) {
        return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
      }, 'changes in working copy detected: \n');
    }
  }
};

module.exports.SvnReleaseUtils = SvnReleaseUtils;