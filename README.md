svn-release
===========

[![Build Status](https://travis-ci.org/codeweaver-pl/svn-release.svg)](https://travis-ci.org/codeweaver-pl/svn-release)
[![CircleCI](https://img.shields.io/circleci/project/codeweaver-pl/svn-release/master.svg?style=shield)](https://circleci.com/gh/codeweaver-pl/svn-release)

[![Code Climate](https://codeclimate.com/github/codeweaver-pl/svn-release/badges/gpa.svg)](https://codeclimate.com/github/codeweaver-pl/svn-release)
[![Test Coverage](https://codeclimate.com/github/codeweaver-pl/svn-release/badges/coverage.svg)](https://codeclimate.com/github/codeweaver-pl/svn-release/coverage)

[![dependencies](https://david-dm.org/codeweaver-pl/svn-release.svg)](https://david-dm.org/codeweaver-pl/svn-release)
[![devDependencies](https://david-dm.org/codeweaver-pl/svn-release/dev-status.svg)](https://david-dm.org/codeweaver-pl/svn-release#info=devDependencies)

[![GitHub version](https://badge.fury.io/gh/codeweaver-pl%2Fsvn-release.svg)](http://badge.fury.io/gh/codeweaver-pl%2Fsvn-release)
[![npm version](https://badge.fury.io/js/svn-release.svg)](http://badge.fury.io/js/svn-release)

[![npm](https://img.shields.io/npm/dm/localeval.svg)](https://github.com/codeweaver-pl/svn-release)

[![GitHub issues](https://img.shields.io/github/issues/codeweaver-pl/svn-release.svg)](https://github.com/codeweaver-pl/svn-release/issues)
[![Join the chat at https://gitter.im/codeweaver-pl/svn-release](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/codeweaver-pl/svn-release?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![License](http://img.shields.io/:license-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)

* [Introduction](#introduction)
* [Installation](#installation)
* [Usage](#usage)
  * [API](#api)
  * [CLI](#cli)
* [License](#license)

## Introduction

A subversion release toolkit module for node.js projects.

## Installation

With [npm](http://npmjs.org) do:

```
npm install svn-release
```

or, to make use of modules command line interface:

```
npm install -g svn-release
```

## Usage
  
`svn-release` can be used in a programmatic or in   a command line fashion.    
  
### API

#### Performing releases

```javascript
  var pkg = require('./package.json'),
    svnOptions = {cwd: '.'},
    releaseOptions = new SvnRelease.SvnDefaults(pkg.version)
                                .releaseOptions({dist: 'dist'});

  return new SvnRelease(svnOptions)
    .release(releaseOptions);
```
  
### CLI
 
#### Displaying help information

`svn-release --help`:

```
Usage: svn-release <cmd> [options...]

Commands:

branch [options]    create new branch, based on current working copy
release [options]   create new release, based on current working copy

Options:

  -h, --help         output usage information
  -V, --version      output the version number
  -I, --interactive  perform branch or release tasks in interactive mode
```

#### Performing releases

`svn-release release --help`:

```
Usage: release [options]

create new release, based on current working copy

Options:

  -h, --help                       output usage information
  -n, --release-name [name]        overrides default release version
  -r, --release-version [version]  overrides default release version
  -N, --next-version [version]     overrides next version
  -d, --dist [dist-folder]         include distribution folder on release
  -R, --releases [path]            relative path to releases (tags)
```

#### Branching

`svn-release branch --help` :

```
Usage: branch [options]

create new branch, based on current working copy

Options:

  -h, --help                      output usage information
  -n, --branch-name [name]        override default branch name
  -b, --branch-version [version]  override default branch version
  -N, --next-version [version]    override next version
  -B, --branches [path]           relative path to branches
```

## License

`svn-release` is available under the following licenses:

  * Apache 2.0