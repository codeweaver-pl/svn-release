"use strict";
var _ = require('lodash');
var async = require('async');

function f1(arg1) {
  return function (callback) {
    callback(null, 2 * arg1);
  }
}

function f2(arg1, arg2, callback) {
  callback(null, arg2 + arg1);
}

function f3(arg1) {
  return function (argx, callback) {
    callback(null, argx * arg1);
  }
}

function f4() {
  return _.partial(f2, 5);
}


var x = async.seq(f1(1), f3(-1), f4());

x(console.log);