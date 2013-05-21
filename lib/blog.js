/*jshint -W015 */

var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , Tag = require('./tag').Tag
  , Category = require('./category').Category
  , Post = require('./post').Post
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
    this.public = options.public !== false;
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
 * @param {Array} keys (optional)
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

/**
 * Load blog categories and tags.
 *
 * @param {Function} callback
 */

Blog.prototype.loadTerms = function (callback) {
    var sql = this.sql(function () {/*
        SELECT taxonomy.term_taxonomy_id, name, slug, taxonomy.taxonomy,
            parent.term_taxonomy_id
        FROM %s_term_taxonomy taxonomy
        INNER JOIN %s_terms terms ON terms.term_id = taxonomy.term_id
        LEFT JOIN %s_term_taxonomy parent ON parent.term_id = taxonomy.parent
            AND parent.taxonomy = 'category'
    */});
    var terms = {};
    this.connection.iter(sql, function (row) {
        var term;
        if (row[3] === 'post_tag') {
            term = new Tag(row[1], row[2]);
        } else if (row[3] === 'category') {
            term = new Category(row[1], row[2], row[4], null);
        } else {
            return; //unsupported
        }
        terms[row[0]] = term;
    }, function (err) {
        var term, id;
        for (id in terms) {
            term = terms[id];
            if (term.parent) {
                term.parent = terms[term.parent];
                term.parent.children = term.parent.children || [];
                term.parent.children.push(term);
            }
        }
        callback(err, terms);
    });
};

/**
 * Load blog post => term relationships.
 *
 * @param {Function} callback
 */

Blog.prototype.loadTermRelationships = function (callback) {
    var sql = this.sql(function () {/*
        SELECT object_id, GROUP_CONCAT(term_taxonomy_id)
        FROM %s_term_relationships
        GROUP BY 1
    */});
    var relationships = {};
    this.connection.iter(sql, function (row) {
        relationships[row[0]] = row[1].split(',');
    }, function (err) {
        callback(err, relationships);
    });
};

/**
 * Load blog posts.
 *
 * @param {Array} meta_keys (optional)
 * @param {Function} callback
 */

Blog.prototype.loadPosts = function (callback) {
    var sql = this.sql(function () {/*
        SELECT ID, post_title, post_content, post_excerpt, post_name,
            post_date_gmt, post_modified_gmt, post_status
        FROM %s_posts
        WHERE post_status = "publish" AND post_type = "post"
    */});
    var posts = [];
    this.connection.iter(sql, function (row) {
        var post = new Post();
        post.id = row[0];
        post.title = row[1];
        post.content = row[2];
        post.excerpt = row[3];
        post.name = row[4];
        post.date = new Date(row[5]);
        post.modified = new Date(row[6]);
        posts.push(post);
    }, function (err) {
        callback(err, posts);
    });
};

