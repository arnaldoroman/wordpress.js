var utils = require('./utils')
  , Blog = require('./blog').Blog;

/**
 * Create a new Multisite instance.
 *
 * @param {MySQL} connection
 * @param {Object} options (optional)
 */

function Multisite(connection, options) {
    this.connection = connection;
    this.options = options || (options = {});
    this.prefix = options.prefix || 'wp';
    if (options.database) {
        this.prefix = options.database + '.' + this.prefix;
    }
}

exports.Multisite = Multisite;

/**
 * A helper for writing SQL.
 *
 * @param {String} sql
 * @param {String}
 */

Multisite.prototype.sql = function (sql) {
    return sql.replace(/%s/g, this.prefix);
};

/**
 * Get all blogs in the multisite install.
 *
 * @param {Function} callback
 */

Multisite.prototype.getBlogs = function (callback) {
    var sql = this.sql(
        'SELECT blog_id, domain, path, public ' +
        'FROM %s_blogs ' +
        'WHERE path != "/" ' +
        'ORDER BY blog_id'
    );
    var blogs = [], self = this;
    this.connection.iter(sql, function (row) {
        var options = utils.copy(self.options, {
            id: Number(row[0])
          , site: row[1]
          , name: row[2].replace(/\//g, '')
          , public: row[3] !== '0'
        });
        blogs.push(new Blog(self.connection, options));
    }, function (err) {
        callback(err, blogs);
    });
};

