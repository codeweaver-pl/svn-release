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

  ExtSvn.cp = ExtSvn.copy = function (source, target, message, callback) {
    return this.run(['copy', source, target, '-m', '"' + message + '"'], callback);
  };

  ExtSvn.rv = ExtSvn.revert = function (options, target, callback) {
    return this.run(['revert', target, options], callback);
  };

  ExtSvn.rm = ExtSvn.delete = function (target, callback) {
    return this.run(['delete', '--keep-local', target], callback);
  };

  return svn;
};
