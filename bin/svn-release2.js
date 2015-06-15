#!/usr/bin/env node
"use strict";

var app = require('../lib/svn-release2'),
  mkdirp = require('mkdirp');

mkdirp('./dist', function (error) {
  if (error) {
    console.error(error);
  } else {
    app.performTag({}, function (err, info) {
      if (err) {
        console.error('error occurred while performing svn release', err);
      } else {
        console.log(info);
      }
    });
  }
});
