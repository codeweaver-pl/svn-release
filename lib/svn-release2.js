"use strict";

var SVN = require('./node.svn-extended');
var argv = require('yargs').argv;
var _ = require('lodash');
var semver = require('semver');
var fs = require('fs');
var async = require('async');

function Config() {
  this.cwd = './';
  this.username = argv.username ? argv.username : this.username;
  this.password = argv.password ? argv.password : this.password;
}

module.exports = {
  safeAddDir: function (config, callback) {

    var svn = new SVN(new Config());

    async.waterfall([
        fetchIgnore,
        unignoreOutput,
        addOutput
      ],
      callback
    );

    function fetchIgnore(callback) {
      svn.pg('svn:ignore', '.', callback);
    }

    function unignoreOutput(ignoreData, callback) {
      svn.ps('svn:ignore', _.without(ignoreData.split('\n'), dirname).join('\n'), '.', callback);
    }

    function addOutput(callback) {
      svn.add(dirname, callback);
    }
  }
};