#!/usr/bin/env node
"use strict";

var log            = require('npmlog'),
    SvnRelease     = require('../lib/svn-release'),

    currentVersion = process.env['npm_package_version'],

    svnRelease     = new SvnRelease('.'),
    svnDefaults    = new SvnRelease.SvnDefaults(currentVersion);

log['enableColor']();
log.stream         = process.stdout;

log.log('info', 'svn-release', 'release version %s', currentVersion);

svnRelease.release(svnDefaults.releaseOptions());