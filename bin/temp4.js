"use strict";
var QSVN = require('../lib/q-svn');

var qsvm = new QSVN({cwd: '.'});
qsvm.info().then(console.log).done(console.err);
