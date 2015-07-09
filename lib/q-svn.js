"use strict";

var SVN_OPERATIONS = [
      'add', 'commit', 'cleanup', 'checkout', 'copy', 'info', 'list', 'log',
      'revert', 'remove', 'status', 'switch', 'update', 'propget', 'propset'
    ],
    SVN            = require('node.svn'),
    Q              = require('q');

Q.longStackSupport = true;

function QSVN(config, callback) {

  this.svn = new SVN(config, callback);

  mixinMissingCommands(this.svn);

  SVN_OPERATIONS.forEach(function (operation) {
    this[operation] = Q.nbind(this.svn[operation], this.svn);
  }, this);

  function mixinMissingCommands(svn) {

    svn.pg = svn.propget = svn.pget = function (propertyName, target, callback) {
      return svn.run(['pg', propertyName, target], callback);
    };

    svn.ps = svn.propset = svn.pset = function (propertyName, propertyValue, target, callback) {
      return svn.run(['ps', propertyName, propertyValue, target], callback);
    };

    svn.rm = svn.remove = svn.delete = svn.del = function (target, callback) {
      return svn.run(['delete', '--keep-local', target], callback);
    };

    svn.revert = function (target, options, callback) {
      return svn.run(['revert', target, options], callback);
    };

    svn.cp = svn.copy = function (source, target, message, callback) {
      return svn.run(['copy', source, target, '-m', '"' + message + '"'], callback);
    };

    svn.switch = svn.sw;
  }
}

/**
 * Subversion add
 * @param {!string} path
 * @returns {Promise}
 */
QSVN.prototype.add = function (path) {
  return this.add(path);
};

/**
 * Subversion commit
 * @param {!string[]} files
 * @param {!string} message
 * @returns {Promise}
 */
QSVN.prototype.commit = function (files, message) {
  return this.commit(files, message);
};

/**
 * Subversion cleanup
 * @param {!string} path
 * @returns {Promise}
 */
QSVN.prototype.cleanup = function (path) {
  return this.cleanup(path);
};

/**
 * Subversion checkout
 * @param {!string} command
 * @returns {Promise}
 */
QSVN.prototype.checkout = function (command) {
  return this.checkout(command);
};

/**
 * Subversion copy
 * @param {!string} source
 * @param {!string} target
 * @param {!string} message
 * @returns {Promise}
 */
QSVN.prototype.copy = function (source, target, message) {
  return this.copy(source, target, message);
};

/**
 * Subversion info
 * @param {...string} commands
 * @returns {Promise}
 */
QSVN.prototype.info = function (commands) {
  return this.info(arguments);
};

/**
 * Subversion list
 * @param {!string} path
 * @returns {Promise}
 */
QSVN.prototype.list = function (path) {
  return this.list(path);
};

/**
 * Subversion log
 * @param {?string} command
 * @returns {Promise}
 */
QSVN.prototype.log = function (command) {
  return this.log(command);
};

/**
 * Subversion delete
 * @param {!string} target
 * @returns {Promise}
 */
QSVN.prototype.delete = function (target) {
  return this.remove(target);
};

/**
 * Subversion status
 * @returns {Promise}
 */
QSVN.prototype.status = function () {
  return this.status();
};

/**
 * Subversion switch
 * @param {!string} url Url to upate-switch to
 * @returns {Promise}
 */
QSVN.prototype.switch = function (url) {
  return this.switch(url);
};

/**
 * Subversion update
 * @param {?string} command
 * @returns {Promise}
 */
QSVN.prototype.update = function (command) {
  return this.update(command);
};

/**
 * Subversion propget
 * @param {!string} propertyName
 * @param {!string} target
 * @returns {Promise}
 */
QSVN.prototype.propget = function (propertyName, target) {
  return this.propget(propertyName, target);
};

/**
 * Subversion propset
 * @param {!string} propertyName
 * @param {!string} propertyValue
 * @param {!string} target
 * @returns {Promise}
 */
QSVN.prototype.propset = function (propertyName, propertyValue, target) {
  return this.propset(propertyName, propertyValue, target);
};

/**
 * Subversion revert
 * @param {!string} target
 * @param {?string} options
 * @returns {Promise}
 */
QSVN.prototype.revert = function (target, options) {
  return this.revert(target, options);
};

QSVN.prototype.ci = QSVN.prototype.commit;
QSVN.prototype.ps = QSVN.prototype.pset = QSVN.prototype.propset;
QSVN.prototype.pg = QSVN.prototype.pget = QSVN.prototype.propget;
QSVN.prototype.co = QSVN.prototype.checkout;
QSVN.prototype.cp = QSVN.prototype.copy;
QSVN.prototype.ls = QSVN.prototype.list;
QSVN.prototype.rm = QSVN.prototype.remove = QSVN.prototype.del = QSVN.prototype.delete;
QSVN.prototype.st = QSVN.prototype.status;
QSVN.prototype.sw = QSVN.prototype.switch;
QSVN.prototype.up = QSVN.prototype.update;

module.exports = QSVN;