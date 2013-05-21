/*jshint -W015 */

var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils');

/**
 * Create a new Blog instance.
 *
 * @param {MySQL} connection
 * @param {Object} options (optional)
 */

function Blog(connection, options) {
    this.connection = connection;
    this.options = options || (options = {});
    this.prefix = options.prefix || 'wp';
    if (options.database) {
        this.prefix = options.database + '.' + this.prefix;
    }
    this.id = options.id || null;
    this.name = options.name || null;
    this.site = options.site || null;
    this.public = options.public || null;
    if (this.id) {
        this.prefix += '_' + this.id;
    }
}

inherits(Blog, EventEmitter);

exports.Blog = Blog;

/**
 * A helper for writing SQL.
 *
 * @param {Function} sql
 * @param {String}
 */

Blog.prototype.sql = function (sql) {
    return utils.multiline(sql).replace(/%s/g, this.prefix);
};

/**
 * Load blog metadata with an optional key mask.
 *
 * @param {Array} keys
 * @param {Function} callback
 */

Blog.prototype.loadMetadata = function (keys, callback) {
    var sql = this.sql(function () {/*
        SELECT option_name, option_value
        FROM %s_options
    */});
    if (typeof keys === 'function') {
        callback = keys;
    } else if (Array.isArray(keys)) {
        sql += ' WHERE option_name IN ("' + keys.join('","') + '")';
    }
    var metadata = {};
    this.connection.iter(sql, function (row) {
        metadata[row[0]] = row[1];
    }, function (err) {
        callback(err, metadata);
    });
};
