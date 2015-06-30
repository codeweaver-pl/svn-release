#!/usr/bin/env node
"use strict";

var _           = require('lodash'),
    log         = require('npmlog'),
    SvnRelease  = require('../lib/svn-release'),
    SvnDefaults = require('../lib/svn-defaults'),

    npmCtx      = parseNpmCtx(),

    svnRelease  = new SvnRelease('.'),
    svnDefaults = new SvnDefaults(npmCtx.packageVersion);

log['enableColor']();
log.stream      = process.stdout;

log.info('svn-release', 'release version %s', npmCtx.packageVersion);

svnRelease.release(svnDefaults.releaseOptions);

function parseNpmCtx() {

  return _.chain(process.env)
    .pick(npmProperty)
    .reduce(toSvnReleaseProperty, {})
    .value();

  function npmProperty(value, key) {
    return _.startsWith(key, 'npm');
  }

  function toSvnReleaseProperty(memo, value, key) {
    memo[_.camelCase(key.slice(4))] = value;
    return memo;
  }
}