var Client = require('mariasql');

/**
 * Create a new MySQL connection
 *
 * @param {Object} options
 */

function MySQL(options) {
    this.client = new Client();
    this.options = options;
    this.connected = false;
}

exports.MySQL = MySQL;

/**
 * Connect to the database.
 *
 * @param {Function} callback
 */

MySQL.prototype.connect = function (callback) {
    var self = this;
    this.client.connect(this.options);
    this.client.on('connect', function () {
        self.connected = true;
        callback();
    }).on('error', callback);
};

/**
 * Execute a query and return the resulting rows.
 *
 * @param {String} query
 * @param {Array} args (optional)
 * @param {Function} callback
 */

MySQL.prototype.query = function (query, args, callback) {
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
    var rows = [];
    this.client.query(query, args).on('result', function (result) {
        result.on('row', function (row) {
            rows.push(row);
        }).on('end', function (meta) {
            callback(null, rows, meta);
        }).on('error', callback);
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

MySQL.prototype.iter = function (query, args, iterator, callback) {
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
    this.client.query(query, args).on('result', function (result) {
        result.on('row', iterator).on('end', function (meta) {
            callback(null, null, meta);
        }).on('error', callback);
    });
};

