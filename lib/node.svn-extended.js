"use strict";

var SVN = require('node.svn');

module.exports = function (config, cb) {

  var svn = new SVN(config, cb);

  function ExtSvn(config, cb) {
    SVN.call(this, config, cb);
  }

  ExtSvn.prototype = Object.create(svn);

  var ExtSvnProto = ExtSvn.prototype;

  ExtSvnProto.pg = ExtSvnProto.propget = function (propname, target, callback) {
    return this.run(['pg', propname, target], callback);
  };

  ExtSvnProto.ps = ExtSvnProto.propset = function (propname, value, target, callback) {
    return this.run(['ps', propname, value, target], callback);
  };

  ExtSvnProto.cp = ExtSvnProto.copy = function (source, target, message, callback) {
    return this.run(['copy', source, target, '-m', '"' + message + '"'], callback);
  };

  ExtSvnProto.rv = ExtSvnProto.revert = function (options, target, callback) {
    return this.run(['revert', target, options], callback);
  };

  ExtSvnProto.rm = ExtSvnProto.delete = function (target, callback) {
    return this.run(['delete', '--keep-local', target], callback);
  };

  return new ExtSvn(config, cb);
};
