#!/usr/bin/env node
"use strict";

var SvnRelease     = require('../lib/svn-release'),
    SvnDefaults    = require('../lib/svn-defaults'),

    lifecycleEvent = process.env.npm_lifecycle_event,
    svnDefaults    = new SvnDefaults(process.env.npm_package_version),
    svnRelease     = new SvnRelease('.');