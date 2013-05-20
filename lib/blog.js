var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils');

/*jshint -W015 */

function Blog(connection, name, options) {
    this.connection = connection;
    this.name = name;
    this.options = options || (options = {});
    this.prefix = options.prefix || 'wp';
    if (options.database) {
        this.prefix = options.database + '.' + this.prefix;
    }
    this.id = options.id || null;
    this.site = options.site || null;
    this.public = options.public || null;
    if (this.id) {
        this.prefix += '_' + this.id;
    }
}

inherits(Blog, EventEmitter);

exports.Blog = Blog;

Blog.prototype.sql = function (str) {
    return utils.multiline(str).replace(/%s/g, this.prefix);
};

