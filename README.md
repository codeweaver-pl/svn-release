svn-release
====

[![Join the chat at https://gitter.im/tau-labs/svn-release](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/tau-labs/svn-release?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Subversion release toolkit for node.js projects

[![CircleCI](https://img.shields.io/circleci/project/tau-labs/svn-release/master.svg?style=shield)](https://circleci.com/gh/tau-labs/svn-release)
[![GitHub issues](https://img.shields.io/github/issues/tau-labs/svn-release.svg)](https://github.com/tau-labs/svn-release/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/tau-labs/svn-release/master/LICENSE)

Simple release plugin for apps with Subversion VCS

Installation
----

    npm install svn-release

Or if you want to use the module from CLI:

    npm install -g svn-release

Usage
====

```javascript
var svnRelease = require('svn-release');

svnRelease.performTag({}, function(error) {
    //your error handling code goes here
})
```

```
nsvnr --username <username> --password <password>
```

Requirements
====

Several requirements need to be met regarding `package.json` content:

* `"version"` field is required, it has to conform to semver scheme
* `"repository"` field is required, `"url"` field should point to a valid trunk url

As of now, lu.svn.release works with default svn structure:

```
source-root/
    -trunk
    -tags
```

Command line params
====

lu.svn.release version scheme is based on semver module.

Current release version is being read from `package.json` file.
Target trunk version can be specified in one of the following ways :

*`--patch` - increment patch component
*`--minor` - increment minor component, set patch component to 0
*`--major` - increment major component, set minor and patch components to 0
*`--version <version>` - set trunk version to `<version>`

LICENSE
===

`svn-release` is available under the following licenses:

  * MIT