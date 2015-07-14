"use strict";

var PREFIX       = 'svn-release',
    npmLogger    = require('npmlog'),
    _            = require('lodash');

npmLogger['enableColor']();
npmLogger.stream = process.stdout;

module.exports = {
  debug: _.bind(npmLogger.log, npmLogger, 'verbose', PREFIX),
  info:  _.bind(npmLogger.log, npmLogger, 'info', PREFIX),
  warn:  _.bind(npmLogger.log, npmLogger, 'warn', PREFIX),
  error: _.bind(npmLogger.log, npmLogger, 'error', PREFIX)
};