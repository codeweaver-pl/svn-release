"use strict";

var fs = require('q-io/fs');

module.exports = {
  failOnChanges: failOnChanges,
  setVersion: setVersion,
  loadPackageJson: loadPackageJson,
  branchUrl: branchUrl,
  tagUrl: tagUrl
};

function failOnChanges(status) {

  if (_.any(status, isChange)) {
    throw new Error(
      _.reduce(
        _.filter(status, isChange),
        function (accumulator, statusRow) {
          return accumulator + statusRow.status + ' ' + statusRow.path + '\n';
        },
        'changes in working copy detected: \n'
      ));
  }

  return 'no changes detected';

  function isChange(statusRow) {
    return '?' !== statusRow.status;
  }
}

function setVersion(version) {

  return loadPackageJson()
    .then(updateVersion)
    .then(storePackageJson);

  function updateVersion(packageJson) {
    packageJson.version = version;
    return packageJson;
  }

  function storePackageJson(packageJson) {
    return fs.write('package.json', JSON.stringify(packageJson, null, 2));
  }
}

function loadPackageJson() {
  return fs.read('package.json')
    .then(JSON.parse);
}

function branchUrl(branchOptions) {
  return [
    branchOptions.repoRoot,
    branchOptions.branches,
    branchOptions.branchName
  ].join('/');
}

function tagUrl(releaseOptions) {
  return [
    releaseOptions.repoRoot,
    releaseOptions.tags,
    releaseOptions.tagName
  ].join('/');
}

