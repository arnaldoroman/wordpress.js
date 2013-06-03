var Client = require('mariasql')
  , utils = require('./utils');

/**
 * Create a new connection to the database.
 *
 * @param {Object} options
 */

function Connection(options) {
    this.client = new Client();
    this.options = options || (options = {});
    options.multiStatements = true;
    if (options.port && !/^\d+$/.test(options.port + '')) {
        options.unixSocket = options.port;
        delete options.port;
    }
    this.connected = false;
}

exports.Connection = Connection;

/**
 * Connect to the database.
 *
 * @param {Function} callback
 */

Connection.prototype.connect = function (callback) {
    var self = this;
    function onconnect(err) {
        self.connected = true;
        if (!err) {
            callback();
        } else if (callback) {
            callback(err);
        } else {
            throw err;
        }
    }
    this.client.on('connect', onconnect).on('error', onconnect);
    this.client.connect(this.options);
};

/**
 * Execute a query and return the resulting rows.
 *
 * @param {String} query
 * @param {Array} args (optional)
 * @param {Function} callback
 */

Connection.prototype.query = function (query, args, callback) {
    if (!this.connected) {
        var self = this;
        return setImmediate(function () {
            self.query(query, args, callback);
        });
    }
    if (typeof args === 'function') {
        callback = args;
        args = null;
    }
    var rows = [], info = null;
    this.client.query(query, args, true).on('result', function (result) {
        result.on('row', function (row) {
            rows.push(row);
        }).on('end', function (info_) {
            info = info_;
        }).on('error', callback);
    }).on('end', function () {
        callback(null, rows, info);
    });
};

/**
 * Execute a query and iterate over the resulting rows.
 *
 * @param {String} query
 * @param {Array} args (optional)
 * @param {Function} iterator
 * @param {Function} callback
 */

Connection.prototype.iter = function (query, args, iterator, callback) {
    if (!this.connected) {
        var self = this;
        return setImmediate(function () {
            self.iter(query, args, iterator, callback);
        });
    }
    if (typeof args === 'function') {
        callback = iterator;
        iterator = args;
        args = null;
    }
    this.client.query(query, args, true).on('result', function (result) {
        result.on('row', iterator).on('end', function (meta) {
            callback(null, null, meta);
        }).on('error', callback);
    });
};

/**
 * Get a MySQL formatted date (UTC).
 *
 * @param {Date} date
 * @return {String}
 */

Connection.prototype.date = function (date) {
    var str = date.getUTCFullYear() +
        '-' + utils.pad(date.getUTCMonth() + 1) +
        '-' + utils.pad(date.getUTCDate()) +
        ' ' + utils.pad(date.getUTCHours()) +
        ':' + utils.pad(date.getUTCMinutes()) +
        ':' + utils.pad(date.getUTCSeconds());
    return str;
};

