"use strict";
var _ = require('lodash');
var async = require('async');

function svnpg(name, cwd, callback) {
  setTimeout(function () {
    console.log('step1', name, cwd);
    callback(new Error('step1'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  }, 2000);
}

function svnps(name, value, target, callback) {
  setTimeout(function () {
    console.log('step2', name, value, target);
    callback(null, {arr: value}, 'abc');
  }, 2000);
}

function first(callback) {
  svnpg('ignore', '.', callback)
}

function second(value, callback) {
  svnps('ignore', _.filter(value, function (val) {return val % 2 === 0}), '.', callback);
}

function third(arg1, arg2, callback) {
  setTimeout(function () {
    console.log('step3', arg1, arg2);
    callback(new Error('step3'), arg1 + arg2);
  })
}

function main(err, data) {
  console.log('main', err, data);
}

async.waterfall([
  first, second, third
], main);