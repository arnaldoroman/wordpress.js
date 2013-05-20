var Client = require('mariasql');

function MySQL(options) {
    this.client = new Client();
    this.options = options;
    this.connected = false;
}

exports.MySQL = MySQL;

MySQL.prototype.connect = function (callback) {
    var self = this;
    this.client.connect(this.options);
    this.client.on('connect', function () {
        self.connected = true;
        callback();
    }).on('error', callback);
};

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

MySQL.prototype.iter = function (query, args, iter, callback) {
    if (!this.connected) {
        var self = this;
        return setImmediate(function () {
            self.iter(query, args, callback);
        });
    }
    if (typeof args === 'function') {
        callback = iter;
        iter = args;
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

