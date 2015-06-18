"use strict";
(function () {

    var SVN_DEFAULTS = {
            cwd: '.',
            paths: {
                trunk: 'trunk',
                branches: 'branches',
                tags: 'tags'
            },
            encoding: 'utf-8'
        },
        semver = require('semver'),
        QSVN = require('./q-svn'),
        Q = require('q'),
        _ = require('lodash'),
        util = require('util'),
        sprintf = require('sprintf');

    function SvnReleaseSteps(config) {
        this.config = _.defaults(config, SVN_DEFAULTS);
        this.svn = new QSVN(config);
    }

    SvnReleaseSteps.prototype.noChangesInWorkingCopy = noChangesInWorkingCopy;
    SvnReleaseSteps.prototype.setVersion = setVersion;
    SvnReleaseSteps.prototype.tagWorkingCopy = tagWorkingCopy;
    SvnReleaseSteps.prototype.normalizedRepoUrl = normalizedRepoUrl;
    SvnReleaseSteps.prototype.workingCopyRepoUrl = workingCopyRepoUrl;
    SvnReleaseSteps.prototype.revertLocalChanges = revertLocalChanges;


    module.exports = SvnReleaseSteps;

    function noChangesInWorkingCopy() {

        this.svn.st().then(processSvnStatus);

        function processSvnStatus(svnStatus) {

            util.inherits(ChangesInWorkingCopyError, Error);

            if (!_.isEmpty(svnStatus)) {
                throw new ChangesInWorkingCopyError(svnStatus);
            }

            function ChangesInWorkingCopyError(svnStatus) {
                Error.call(this, _.reduce(svnStatus, function (accumulator, svnStatusRow) {
                    return accumulator + svnStatusRow.status + ' ' + svnStatusRow.path + '\n';
                }, 'changes in working copy detected: \n'), 'ChangesInWorkingCopyError');
            }
        }
    }

    function setVersionStep(version) {

        return readPackageJson().
            then(updateVersion).
            then(storePackageJson)
            .then(commitStep("storing current working copy version: %s"));
    }

    function readPackageJson() {
        return Q.nfbind(fs.readFile, './package.json', {encoding: this.config.encoding}).
            then(function (data) {
                return JSON.parse(data);
            }
        );
    }

    function storePackageJson() {

        return Q.fcall(JSON.stringify, packageJson, '  ').then(function (data) {
            return Q.nfbind(fs.writeFile, './package.json', data, {encoding: this.config.encoding});
        });
    }

    function updateVersion(version) {
        return Q.when(function (packageJson) {
            packageJson.version = version;
            return packageJson;
        });
    }

    function commitStep(message) {
        return Q.fcall(svn.ci, [], message);
    }


    function tagWorkingCopy(target, message, callback) {
        svn.cp('.', target, message, callback);
    }

    function normalizedRepoUrl(args) {
        async.waterfall([
            fetchRepoInfo,
            toUrl,
            toPath,
        ], mainCallback);
    }

    function workingCopyRepoUrl(mainCallback) {
        async.waterfall([
            fetchRepoInfo,
            toUrl
        ], mainCallback);
    }

    function fetchRepoInfo(callback) {
        this.svn.info("", callback);
    }

    function toUrl(svnInfo, callback) {
        callback(null, svnInfo.url);
    }

    function revertLocalChanges() {

    }

    function msg() {
        return 'svn-release: ' + sprintf.apply(sprintf.sprintf, _.toArray(arguments));
    }
})
();