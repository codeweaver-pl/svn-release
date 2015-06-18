"use strict";

var SVN = require('../lib/node.svn-extended'),
    _ = require('lodash'),
    Q = require('Q');

Q.longStackSupport = true;

var SVN_COMMANDS = [
    'pg', 'ps', 'cp', 'rv', 'rm', 'propget', 'propset', 'copy', 'revert', 'del', 'add', 'blame', 'choose', 'cat', 'ci',
    'commit', 'cleanup', 'cl', 'changeList', 'co', 'checkout', 'cp', 'di', 'diff', 'type', 'info', 'ls', 'list', 'lock',
    'log', 'queue', 'revert', 'rm', 'remove', 'del', 'run', 'resolve', 'st', 'status', 'sw', 'switchTo', 'unlock', 'up',
    'update'
];

module.exports = function QSVN(config) {
    var _this = this,
        svn = new SVN(config);

    this.config = config;

    _.each(SVN_COMMANDS, function (command) {
        _this[command] = Q.nbind(svn[command], svn);
    });
};