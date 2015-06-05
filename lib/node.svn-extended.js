"use strict";

var SVN = require('node.svn');

module.exports = function (config, cb) {

  var svn = new SVN(config, cb);

  var ExtSvn = svn.prototype;

  ExtSvn.pg = ExtSvn.propget = function (propname, target, callback) {
    return this.run(['pg', propname, target], callback);
  };

  ExtSvn.ps = ExtSvn.propset = function (propname, value, target, callback) {
    return this.run(['ps', propname, value, target], callback);
  };

  return svn;
};
