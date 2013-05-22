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
    //Allow for injectable types
    options.Tag = options.Tag || Tag;
    options.Category = options.Category || Category;
    options.Post = options.Post || Post;

    //Enable live polling
    if (options.live) {
        this.live();
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

Blog.prototype.sql = function (sql, append) {
    sql = utils.multiline(sql).replace(/%s/g, this.prefix);
    return (append ? ' ' : '') + sql;
};

/**
 * Load blog metadata with an optional key mask.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Blog.prototype.loadMetadata = function (options, callback) {
    var sql = this.sql(function () {/*
        SELECT option_name, option_value
        FROM %s_options
    */});
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
    var sql = this.sql(function () {/*
        SELECT taxonomy.term_taxonomy_id, name, slug, taxonomy.taxonomy,
            parent.term_taxonomy_id
        FROM %s_term_taxonomy taxonomy
        INNER JOIN %s_terms terms ON terms.term_id = taxonomy.term_id
        LEFT JOIN %s_term_taxonomy parent ON parent.term_id = taxonomy.parent
            AND parent.taxonomy = 'category'
    */});
    var Category = this.options.Category
      , Tag = this.options.Tag
      , terms = {};
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
 * @param {Array} post_ids (optional)
 * @param {Function} callback
 */

Blog.prototype.loadTermRelationships = function (post_ids, callback) {
    var sql = this.sql(function () {/*
        SELECT object_id, GROUP_CONCAT(term_taxonomy_id)
        FROM %s_term_relationships
    */});
    if (typeof post_ids === 'function') {
        callback = post_ids;
    } else {
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

    var sql = this.sql(function () {/*
        SELECT post.ID, post.post_title, post.post_content, post.post_excerpt,
            post.post_date_gmt, post.post_modified_gmt, post.post_name,
            thumb.guid
    */});

    if (options.meta_keys) {
        options.meta_keys.forEach(function (key, i) {
            sql += ', meta' + i + '.meta_value';
        });
    }

    sql += this.sql(function () {/*
        FROM %s_posts post
        LEFT JOIN %s_postmeta thumb_id ON thumb_id.meta_key = "_thumbnail_id"
            AND thumb_id.post_id = post.ID
        LEFT JOIN %s_posts thumb ON thumb_id.meta_value = thumb.ID
    */}, true);

    if (options.meta_keys) {
        options.meta_keys.forEach(function (key, i) {
            sql += ' LEFT JOIN ' + self.prefix + '_postmeta meta' + i;
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
            sql += ' AND post_modified_gmt > "' + this.connection.date(options.since) + '"';
        }
        sql += ' ORDER BY post_date_gmt DESC';
    }

    var posts = [];
    this.connection.iter(sql, args, function (row) {
        var meta;
        if (options.meta_keys) {
            meta = {};
            options.meta_keys.forEach(function (key, i) {
                meta[key] = row[8 + i];
            });
        }
        posts.push(new Post(row[0], row[1], row[2], row[3], new Date(row[4]),
            new Date(row[5]), row[6], row[7], meta));
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
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Blog.prototype.loadUnpublishedPosts = function (options, callback) {
    var sql = this.sql(function () {/*
        SELECT ID, post_status
        FROM %s_posts
        WHERE post_type = "post" AND post_status IN ("future", "trash", "draft")
    */});
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
 * The callback receives (err, posts_array, blog_metadata, terms)
 *
 * @param {Function} callback
 */

Blog.prototype.load = function (callback) {
    var self = this;
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
                keys: self.options.postmeta_keys
            }, callback);
        }
    ], function (err, metadata, terms, relationships, posts) {
        if (err) return callback(err);
        self.addPostTerms(posts, terms, relationships);
        callback(null, posts, metadata, terms);
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
        if (!('tags' in post)) {
            post.tags = [];
        }
        if (!('categories' in post)) {
            post.categories = [];
        }
        if (post_relationships) {
            post_relationships.forEach(function (term) {
                term = terms[term];
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
 * Enable live mode where upstream changes are detected and pushed
 * to listeners via events.
 */

Blog.prototype.live = function () {
    var self = this;
    this.last_update = new Date();
    utils.parallel([
        function (next) {
            self.load(function (err, posts, metadata, terms) {
                self.published_posts = {};
                if (err) {
                    self.emit('error', err);
                    self.metadata = {};
                    self.terms = {};
                } else {
                    self.emit('blog', posts, metadata, terms);
                    self.metadata = metadata;
                    self.terms = terms;
                    posts.forEach(function (post) {
                        self.published_posts[post.id] = post;
                    });
                }
                next();
            });
        }
      , function (next) {
            self.loadUnpublishedPosts(function (err, statuses) {
                self.future_posts = {};
                if (err) {
                    self.emit('error', err);
                } else {
                    for (var id in statuses) {
                        if (statuses[id] === 'future') {
                            self.future_posts[id] = true;
                        }
                    }
                }
                next();
            });
        }
    ], function () {
        utils.setInterval(function (next) {
            if (!self.abort_live) {
                return;
            }
            self.poll(function (err) {
                if (err) {
                    self.emit('error', err);
                }
                next();
            });
        }, self.options.interval || 60 * 1000);
    });
};

/**
 * Poll the database for changes.
 *
 * @param {Function} callback
 */

Blog.prototype.poll = function (callback) {
    var last_update = this.last_update
      , self = this;
    this.last_update = new Date();
    utils.parallel([
        function checkPublishedPostsAndTerms(next) {
            self.loadTerms(function (err, terms) {
                if (err) return next(err);
                utils.diff(self.terms, terms, function (changed, added, deleted) {
                    if (changed.length || added.length || deleted.length) {
                        added.forEach(function (key) {
                            self.terms[key] = terms[key];
                        });
                        changed.forEach(function (key) {
                            self.terms[key] = terms[key];
                        });
                        deleted.forEach(function (key) {
                            delete self.terms[key];
                        });
                        self.emit('changed_terms', self.terms, changed, added, deleted);
                    }
                });
                self.loadPosts({
                    since: last_update
                  , keys: self.options.postmeta_keys
                }, function (err, posts) {
                    if (err) return next(err);
                    var post_ids = posts.map(function (post) {
                        return post.id;
                    });
                    self.loadTermRelationships(post_ids, function (err, relationships) {
                        if (err) return next(err);
                        self.addPostTerms(posts, terms, relationships);
                        posts.forEach(function (post) {
                            if (!(post.id in self.published_posts)) {
                                self.emit('added_post', post);
                            } else {
                                self.emit('updated_post', post);
                            }
                            self.published_posts[post.id] = post;
                            delete self.future_posts[post.id];
                        });
                        self.emit('modified_posts', posts);
                        next();
                    });
                });
            });
        }
      , function checkUnpublishedPosts(next) {
            self.loadUnpublishedPosts(function (err, statuses) {
                if (err) return next(err);
                var removed = [], post;
                for (var id in statuses) {
                    if (id in self.published_posts) {
                        post = self.published_posts[id];
                        delete self.published_posts[id];
                        self.emit('removed_post', post);
                        removed.push(post);
                    }
                    if (statuses[id] === 'future') {
                        self.future_posts[id] = true;
                    } else {
                        delete self.future_posts[id];
                    }
                }
                self.emit('removed_posts', removed);
                next();
            });
        }
      , function checkMetadata(next) {
            self.loadMetadata({
                keys: self.options.option_keys
            }, function (err, metadata) {
                if (err) return next(err);
                utils.diff(self.metadata, metadata, function (changed, added, deleted) {
                    if (changed.length || added.length || deleted.length) {
                        added.forEach(function (key) {
                            self.metadata[key] = metadata[key];
                        });
                        changed.forEach(function (key) {
                            self.metadata[key] = metadata[key];
                        });
                        deleted.forEach(function (key) {
                            delete self.metadata[key];
                        });
                        self.emit('changed_metadata', self.metadata, changed, added, deleted);
                    }
                });
                next();
            });
        }
    ], callback);
};

/**
 * Abort live polling.
 */

Blog.prototype.abort = function () {
    this.abort_live = true;
};

/*jshint +W015 */

