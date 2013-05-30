var Tag = require('./tag').Tag
  , Category = require('./category').Category
  , Post = require('./post').Post
  , Metadata = require('./metadata').Metadata
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
    options.prefix = options.prefix || 'wp';
    if (options.database) {
        options.prefix = options.database + '.' + options.prefix;
    }
    if (options.id) {
        options.prefix += '_' + options.id;
    }
    //Allow for injectable types
    options.Tag = options.Tag || Tag;
    options.Category = options.Category || Category;
    options.Post = options.Post || Post;
    options.Metadata = options.Metadata || Metadata;
}

exports.Blog = Blog;

/**
 * A helper for writing SQL.
 *
 * @param {String} sql
 * @param {String}
 */

Blog.prototype.sql = function (sql) {
    return sql.replace(/%s/g, this.options.prefix);
};

/**
 * Load blog metadata with an optional key mask.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Blog.prototype.loadMetadata = function (options, callback) {
    var sql = this.sql(
        'SELECT option_name, option_value ' +
        'FROM %s_options'
    );
    if (typeof options === 'function') {
        callback = options;
    } else if (Array.isArray(options.keys)) {
        sql += ' WHERE option_name IN ("' + options.keys.join('","') + '")';
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
    var sql = this.sql(
        'SELECT taxonomy.term_taxonomy_id, name, slug, taxonomy.taxonomy, ' +
        '    parent.term_taxonomy_id ' +
        'FROM %s_term_taxonomy taxonomy ' +
        'INNER JOIN %s_terms terms ON terms.term_id = taxonomy.term_id ' +
        'LEFT JOIN %s_term_taxonomy parent ON parent.term_id = taxonomy.parent ' +
        '    AND parent.taxonomy = "category"'
    );
    var Category = this.options.Category
      , Tag = this.options.Tag
      , terms = {};
    this.connection.iter(sql, function (row) {
        var term;
        if (row[3] === 'post_tag') {
            term = new Tag(row[0], row[1], row[2]);
        } else if (row[3] === 'category') {
            term = new Category(row[0], row[1], row[2], row[4], null);
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
 * @param {Array} post_ids (optional)
 * @param {Function} callback
 */

Blog.prototype.loadTermRelationships = function (post_ids, callback) {
    var sql = this.sql(
        'SELECT object_id, GROUP_CONCAT(term_taxonomy_id) ' +
        'FROM %s_term_relationships'
    );
    if (typeof post_ids === 'function') {
        callback = post_ids;
    } else if (post_ids.length) {
        sql += ' WHERE object_id IN (' + post_ids.join(',') + ')';
    }
    sql += ' GROUP BY 1';
    var relationships = {};
    this.connection.iter(sql, function (row) {
        relationships[row[0]] = row[1].split(',');
    }, function (err) {
        callback(err, relationships);
    });
};

/**
 * Load published blog posts.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Blog.prototype.loadPosts = function (options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    var self = this, args = []
      , Post = this.options.Post;

    var sql = this.sql(
        'SELECT post.ID, post.post_title, post.post_content, post.post_excerpt, ' +
        '    post.post_date_gmt, post.post_modified_gmt, post.post_name, ' +
        '   thumb.guid '
    );

    if (options.meta_keys) {
        options.meta_keys.forEach(function (key, i) {
            sql += ', meta' + i + '.meta_value ';
        });
    }

    sql += this.sql(
        'FROM %s_posts post ' +
        'LEFT JOIN %s_postmeta thumb_id ON thumb_id.meta_key = "_thumbnail_id" ' +
        '    AND thumb_id.post_id = post.ID ' +
        'LEFT JOIN %s_posts thumb ON thumb_id.meta_value = thumb.ID '
    );

    if (options.meta_keys) {
        options.meta_keys.forEach(function (key, i) {
            sql += ' LEFT JOIN ' + self.options.prefix + '_postmeta meta' + i;
            sql += ' ON meta' + i + '.meta_key = ?';
            sql += ' AND meta' + i + '.post_id = post.ID';
            args.push(key);
        });
    }

    if (options.id) {
        sql += ' WHERE post.ID = ? LIMIT 1';
        args.push(options.id);
    } else {
        sql += ' WHERE post.post_status = "publish" AND post.post_type = "post"';
        if (options.since) {
            sql += ' AND (post.post_modified_gmt > ?';
            args.push(this.connection.date(options.since));
            if (options.scheduled && options.scheduled.length) {
                sql += ' OR post.ID IN (' + options.scheduled.join(',') + ')';
            }
            sql += ')';
        }
        sql += ' ORDER BY post.post_date_gmt DESC';
    }

    var posts = [];
    this.connection.iter(sql, args, function (row) {
        var metadata;
        if (options.meta_keys) {
            metadata = {};
            options.meta_keys.forEach(function (key, i) {
                metadata[key] = row[8 + i];
            });
        }
        posts.push(new Post(row[0], row[1], row[2], row[3], new Date(row[4]),
            new Date(row[5]), row[6], row[7], metadata));
    }, function (err) {
        callback(err, posts);
    });
};

/**
 * Load a single blog post
 *
 * @param {Number} id
 * @param {Options} object
 * @param {Function} callback
 */

Blog.prototype.loadPost = function (id, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    } else {
        options = utils.copy(options);
    }
    options.id = id;
    this.loadPosts(options, function (err, posts) {
        if (err) return callback(err);
        callback(null, posts.shift());
    });
};

/**
 * Load unpublished blog posts.
 *
 * @param {Function} callback
 */

Blog.prototype.loadUnpublishedPosts = function (callback) {
    var sql = this.sql(
        'SELECT ID, post_status ' +
        'FROM %s_posts ' +
        'WHERE post_type = "post" AND post_status IN ("future", "trash", "draft")'
    );
    var posts = {};
    this.connection.iter(sql, function (row) {
        posts[row[0]] = row[1];
    }, function (err) {
        callback(err, posts);
    });
};

/**
 * Load the blog.
 *
 * The callback receives (err, posts_array, blog_metadata)
 *
 * @param {Function} callback
 */

Blog.prototype.load = function (callback) {
    var Metadata = this.options.Metadata
      , self = this;
    utils.parallel([
        function (callback) {
            self.loadMetadata({
                keys: self.options.option_keys
            }, callback);
        },
        function (callback) {
            self.loadTerms(callback);
        },
        function (callback) {
            self.loadTermRelationships(callback);
        },
        function (callback) {
            self.loadPosts({
                meta_keys: self.options.postmeta_keys
            }, callback);
        }
    ], function (err, metadata, terms, relationships, posts) {
        if (err) return callback(err);
        self.addPostTerms(posts, terms, relationships);
        var archive = self.generateArchive(posts);
        metadata = new Metadata(metadata, terms, archive, self.options);
        callback(null, posts, metadata);
    });
};

/**
 * Bind terms to post objects based on the specified relationships.
 *
 * @param {Array} posts
 * @param {Object} terms
 * @param {Object} relationships
 */

Blog.prototype.addPostTerms = function (posts, terms, relationships) {
    posts.forEach(function (post) {
        var post_relationships = relationships[post.id];
        post.tags = [];
        post.categories = [];
        if (post_relationships) {
            post_relationships.forEach(function (term) {
                term = terms[term];
                if (!term) {
                    return;
                }
                if (term instanceof Tag) {
                    post.tags.push(term);
                } else {
                    post.categories.push(term);
                }
            });
        }
    });
};

/**
 * Generate an archive index based on an array of posts.
 *
 * @param {Array} posts
 * @return {Array} archive
 */

Blog.prototype.generateArchive = function (posts) {
    var index = {}, archive = [];
    posts.forEach(function (post) {
        var year = post.date.getFullYear();
        if (!year || year <= 1970) {
            return;
        }
        var month = post.date.getMonth() + 1;
        if (!(year in index)) {
            index[year] = {};
        }
        if (!(month in index[year])) {
            index[year][month] = 1;
        } else {
            index[year][month]++;
        }
    });
    var years = Object.keys(index).map(Number).sort(utils.descending);
    years.forEach(function (year) {
        var months = Object.keys(index[year]).map(Number).sort(utils.descending);
        archive.push({
            year: year
          , months: months.map(function (month) {
                return {
                    month: utils.pad(month)
                  , count: index[year][month]
                };
            })
        });
    });
    return archive;
};

