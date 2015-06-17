"use strict";

var SVN = require('node.svn');

module.exports = function (config, cb) {

  var svn = new SVN(config, cb);

  function ExtSvn(config, cb) {
    SVN.call(this, config, cb);
  }

  ExtSvn.prototype = Object.create(svn);

  ExtSvn.prototype.pg = ExtSvn.prototype.propget = function (propname, target, callback) {
    return this.run(['pg', propname, target], callback);
  };

  ExtSvn.prototype.ps = ExtSvn.prototype.propset = function (propname, value, target, callback) {
    return this.run(['ps', propname, value, target], callback);
  };

  ExtSvn.prototype.cp = ExtSvn.prototype.copy = function (source, target, message, callback) {
    return this.run(['copy', source, target, '-m', '"' + message + '"'], callback);
  };

  ExtSvn.prototype.rv = ExtSvn.prototype.revert = function (options, target, callback) {
    return this.run(['revert', target, options], callback);
  };

  ExtSvn.prototype.rm = ExtSvn.prototype.delete = function (target, callback) {
    return this.run(['delete', '--keep-local', target], callback);
  };

  return new ExtSvn(config, cb);
};
