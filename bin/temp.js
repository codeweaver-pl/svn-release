"use strict";

var _ = require('lodash'),
  async = require('async'),
  sprintf = require('sprintf'),
  fs = require('fs');

function svnReleaseSteps(config) {

  function SvnReleaseSteps(config) {
    this.config = config;
    this.svn = new Svn();
  }

  function Svn() {
    this.ci = function (files, message, callback) {
      console.log(files, message);
      callback(null, null);
    }
  }

  SvnReleaseSteps.prototype.setVersionStep = setVersionStep;
  SvnReleaseSteps.prototype.readPackageJsonStep = readPackageJsonStep;
  SvnReleaseSteps.prototype.storePackageJsonStep = storePackageJsonStep;
  SvnReleaseSteps.prototype.commitStep = commitStep;

  function msg() {
    return 'svn-release: ' + sprintf.apply(sprintf.sprintf, _.toArray(arguments));
  }

  function setVersionStep(version) {
    return async.seq(
      this.readPackageJsonStep(),
      function (packageJson, callback) {
        packageJson.version = version;
        callback(null, packageJson);
      },
      this.storePackageJsonStep(),
      this.commitStep(msg("storing current working copy version: %s", version)));
  }


  function readPackageJsonStep() {
    return async.seq(
      _.partial(fs.readFile, './package.json', {encoding: this.config.encoding}),
      function (data, callback) {
        callback(null, JSON.parse(data));
      }
    );
  }

  function storePackageJsonStep() {
    var options = {encoding:this.config.encoding};
    return function(packageJson, callback) {
    try {
      var data = _.isObject(packageJson) ? JSON.stringify(packageJson, null, '  ') : packageJson;
      fs.writeFile('./package.json', data, options, callback);
    } catch(err) {
      callback(err);
    }
  }
  }

  function commitStep(message) {
    return _.partial(this.svn.ci, [], message);
  }

  return new SvnReleaseSteps(config);
}


async.series([svnReleaseSteps({encoding: 'utf-8'}).setVersionStep('0.1.9')], console.log);