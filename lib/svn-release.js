"use strict";

var SVN = require('./node.svn-extended');
var argv = require('yargs').argv;
var _ = require('lodash');
var semver = require('semver');
var fs = require('fs');

var safeAddDir = function (svn, dirname, callback) {

  svn.pg('svn:ignore', '.', function (error, data) {
    if (error) {
      callback(error);
    } else {
      var psValue = data.replace(new RegExp('[\\s]*\\n?' + dirname + '[\\s]*\\n'), '');
      svn.ps('svn:ignore', psValue, '.', function (error) {
        if (error) {
          callback(error);
        } else {
          svn.add(dirname, callback);
        }
      });
    }
  });
};

var safeRemoveDir = function (svn, dirname, callback) {

  svn.rm(dirname, function (error) {
    if (error) {
      callback(error);
    } else {
      svn.pg(svn, 'svn:ignore', '.', function (error, data) {
        if (error) {
          callback(error);
        } else {
          if (data.indexOf(dirname) === -1) {
            var psValue = data.replace(/([\s]*\n)*$/, '\n' + dirname);
            svn.ps('svn:ignore', psValue, '.', function (error, info) {
              if (error) {
                callback(error);
              } else {
                callback(null, info);
              }
            });
          } else {
            callback(null, data);
          }
        }
      });
    }
  });
};

var prettyJSON = function (obj) {
  return JSON.stringify(obj, null, '  ');
};

var packageJSON = function () {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

var storePackageJSON = function (data) {
  fs.writeFileSync('./package.json', data);
};

var maskPwd = function (obj) {
  var masked = _.clone(obj);
  if (_.isString(masked.password)) {
    masked.password = masked.password.replace(/./g, '*');
  }
  return masked;
};

var getBumpOptions = function () {

  var bumpOptions = {};

  var versionParams = _.pick(argv, 'major', 'minor', 'patch', 'version');
  var versionKeys = _.keys(versionParams);

  switch (versionKeys.length) {
    case 0:
      bumpOptions.type = 'patch';
      break;
    case 1:
      if (versionKeys[0] === 'version') {
        bumpOptions.version = argv.version;
      } else {
        bumpOptions.type = versionKeys[0];
      }
      break;
    default:
      throw new Error('multiple bump parameters provided: ' + prettyJSON(versionParams));
  }

  return bumpOptions;
};

var performCommit = function (svn, parameters, callback) {
  svn.ci([], 'svn.release plugin, new trunk version: ' + parameters.newVersion, function (error, info) {
    if (error) {
      console.log('error occurred while executing svn status command: ', error);
    } else {
      console.log("svn commit successful: " + prettyJSON(info));
    }
    callback(error, info);
  });
};

var svnUrl = function url(svn, callback) {
  svn.info(function (error, info) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, info.url);
    }
  });
};

var withRepoParams = function (svn, parameters, callback) {

  console.log('parameters: ' + prettyJSON(maskPwd(parameters)));

  var bumpOptions = getBumpOptions();
  var packageJson = packageJSON();

  var repoParams = _.clone(parameters);

  repoParams.currentVersion = packageJson.version;

  repoParams.newVersion = _.has(bumpOptions, 'version') ?
    bumpOptions.version : semver.inc(repoParams.currentVersion, bumpOptions.type);

  repoParams.source = '.';

  svnUrl(svn, function (error, url) {
    if (error) {
      callback(error, null);
    } else {
      if (url.indexOf('branches') > -1) {
        repoParams.target = url
            .replace('branches', 'tags') + '-' + repoParams.currentVersion;
      } else {
        repoParams.target = url
          .replace('trunk', 'tags/' + repoParams.currentVersion);
      }
      console.log('repoParams: ' + prettyJSON(maskPwd(repoParams)));
      callback(null, repoParams);
    }
  });
};

var performTag = function (svn, parameters, callback) {

  try {
    withRepoParams(svn, _.pick(argv, 'username', 'password'), function (error, extendedParameters) {
      if (error) {
        callback(error, null);
      } else {
        validateParameters(extendedParameters);
        checkForModifications(svn, extendedParameters, function (svn, extendedParameters) {
          doTag(svn, extendedParameters, function (svn, extendedParameters) {
            performCommit(svn, extendedParameters, callback);
          }, callback);
        }, callback);

      }
    });
  } catch (error) {
    callback(error);
  }
};

var doTag = function (svn, parameters, next, callback) {
  safeAddDir(svn, 'dist', function (error) {
    if (error) {
      callback(error);
    } else {
      svn.cp(parameters.source, parameters.target, "svn.release plugin: " + parameters.currentVersion,
        function (error, info) {
          if (error) {
            console.log('error occurred while executing svn copy command: ', error);
            callback(error);
          } else {
            console.log("svn copy successful: " + prettyJSON(info));
            svn.rv('--recursive', '.', function(error, info) {
              if (error) {
                console.log('error occurred while executing svn revert command: ', error);
                callback(error);
              } else {
                console.log('revert successful: ', info);
                var pj = packageJSON();
                pj.version = parameters.newVersion;
                storePackageJSON(prettyJSON(pj));
                next(svn, parameters);
              }
            });
          }
        });
    }
  });
};

var checkForModifications = function (svn, parameters, next, callback) {
  svn.st(function (error, info) {
    if (error) {
      console.log('error occurred while executing svn status command: ', error);
      callback(error);
    } else if (info.length) {
      var statusInfo = '\n';
      _.each(info, function (infoRow) {
        statusInfo += infoRow.status + ' ' + infoRow.path + '\n';
      });
      console.log('changes in working copy detected: ' + statusInfo);
      callback(new Error('changes in working copy detected: ' + statusInfo));
    } else {
      next(svn, parameters);
    }
  });
};

var validateParameters = function (parameters) {

  var requiredKeys = ['currentVersion', 'newVersion'];

  if (_.any(requiredKeys, function (paramKey) {
      return !(parameters[paramKey]);
    })) {
    throw new Error('required parameters missing: ' + _.difference(requiredKeys, _.keys(parameters)));
  }



  var nonString = _.filter(requiredKeys, function (paramKey) {
    return !_.isString(parameters[paramKey]);
  });

  if (nonString.length) {
    throw new Error('illegal parameter values (provide strings): ' + nonString);
  }

};

function Config() {
  this.cwd = './';
  this.username = argv.username ? argv.username : this.username;
  this.password = argv.password ? argv.password : this.password;
}

var luSvnReleaseModule = {
  performTag: function (config, callback) {
    performTag(new SVN(new Config()), config, callback);
  },
  safeAddDir: function (dirname, callback) {
    safeAddDir(new SVN(new Config()), dirname, callback);
  },
  safeRemoveDir: function (dirname, callback) {
    safeRemoveDir(new SVN(new Config()), dirname, callback);
  }
};

module.exports = luSvnReleaseModule;