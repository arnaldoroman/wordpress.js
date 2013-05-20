var utils = require('./utils')
  , Blog = require('./blog').Blog;

/*jshint -W015 */

function Multisite(connection, options) {
    this.connection = connection;
    this.options = options || (options = {});
    this.prefix = options.prefix || 'wp';
    if (options.database) {
        this.prefix = options.database + '.' + this.prefix;
    }
}

exports.Multisite = Multisite;

Multisite.prototype.sql = function (str) {
    return utils.multiline(str).replace(/%s/g, this.prefix);
};

Multisite.prototype.getBlogs = function (callback) {
    var self = this;
    var sql = this.sql(function () {/*
        SELECT * FROM %s_blogs
        WHERE path != "/"
        ORDER BY blog_id
    */});
    this.connection.query(sql, function (err, rows) {
        if (err) {
            return callback(err);
        }
        callback(null, rows.map(function (row) {
            var options = utils.copy(self.options, {
                id: row.blog_id
              , site: row.site
              , name: row.path.replace(/\//g, '')
              , public: (row.public + '') !== '0'
            });
            return new Blog(self.connection, options);
        }));
    });
};

