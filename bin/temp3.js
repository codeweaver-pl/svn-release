"use strict";
var _ = require('lodash');
var q = require('q');
var SVN = require('../lib/node.svn-extended');

function QSVN(config) {
  this.svn = new SVN(config);
  this.info = q.nbind(this.svn.info, this.svn);
  this.status = q.nbind(this.svn.st, this.svn);
}

var s = new QSVN({cwd:'.'});
s.status().then(function(data) {
  console.log(data);
}).fail(console.log).done();