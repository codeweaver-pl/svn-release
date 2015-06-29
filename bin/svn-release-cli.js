"use strict";

var URI_REGEXP     = /^(((?:(?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(:(?:\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|([a-z0-9+.-]+:)(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(\?(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?(#(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?$/i,
    BOOLEAN_REGEXP = /^((true)|(false))$/i,
    NAME_REGEXP    = /^[\w-]+$/i,
    semverRegex    = require('semver-regex'),
    _              = require('lodash');

module.exports = {
  uri:            URI_REGEXP,
  boolean:        BOOLEAN_REGEXP,
  name:           NAME_REGEXP,
  version:        semverRegex,
  releaseOptions: releaseOptions,
  branchOptions:  branchOptions
};

function branchOptions(opts) {
  return _.pick(opts, 'branchName',
                'branchVersion',
                'nextVersion',
                'branches');
}

function releaseOptions(opts) {
  return _.pick(opts, 'releaseName',
                'releaseVersion',
                'nextVersion',
                'releases',
                'dist');
}
