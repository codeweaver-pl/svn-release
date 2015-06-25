#!/usr/bin/env node
"use strict";

var app = new (require('../lib/svn-release'))('.'),
  program = require('commander');

program
  .arguments('<command> [options...]')
  .version('0.0.1')
  .option('-I,--interactive', 'perform branch or release tasks in interactive mode')
  .option('-T, --trunk <path>', 'relative path to trunk')
  .option('-B, --branches <path>', 'relative_path_to_branches')
  .option('-R, --tags <path>', 'relative path to tags/releases');

program
  .command('branch')
  .description('create new branch, based on current working copy')
  .option('-b, --branch-version <version>', 'override default branch version')
  .option('-n, --branch-name <name>', 'override default branch name')
  .option('-N, --next-version <version>', 'override next version')
  .action(function(options) {
            console.log('BRAAAAAAAAAAAANCH', options.branchVersion)
          });

program
  .command('release')
  .description('create new release, based on current working copy')
  .option('-r, --release-version <version>', 'overrides default release version')
  .option('-N, --next-version <version>', 'overrides next version')
  .option('-d, --include-dist', 'include distribution folder on release')
  .action(function(options) {
            //app.branch({}).done(console.log);
          });


program.parse(process.argv);

app.branch({branchVersion: '1.1.1', branchName: 'asd', nextVersion: '5'});