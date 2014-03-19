var Tag = require('./tag').Tag
  , Category = require('./category').Category
  , Post = require('./post').Post
  , Metadata = require('./metadata').Metadata
  , utils = require('./utils');

/**
 * Create a new Loader instance.
 *
 * @param {MySQL} connection
 * @param {Object} options (optional)
 */

function Loader(connection, options) {
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

exports.Loader = Loader;

/**
 * A helper for writing SQL.
 *
 * @param {String} sql
 * @param {String}
 */

Loader.prototype.sql = function (sql) {
    return sql.replace(/%s/g, this.options.prefix);
};

/**
 * Load blog metadata with an optional key mask.
 *
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Loader.prototype.loadMetadata = function (options, callback) {
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

Loader.prototype.loadTerms = function (callback) {
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

Loader.prototype.loadTermRelationships = function (post_ids, callback) {
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
 * Load post meta keys.
 *
 * Note: there is no UNIQUE constraint on post_id, meta_key in the
 * wordpress postmeta tables. This method will therefore ignore
 * duplicate entries on (post_id, meta_key).
 *
 * @param {Array} meta_keys
 * @param {Function} callback
 */

Loader.prototype.loadPostMeta = function (meta_keys, callback) {
    if (!meta_keys.length) {
        return callback(null, {});
    }
    var sql = this.sql(
        'SELECT post_id, meta_key, meta_value ' +
        'FROM %s_postmeta ' +
        'WHERE meta_key IN ("' + meta_keys.join('","') + '")'
    );
    var metadata = {};
    this.connection.iter(sql, function (row) {
        if (!(row[0] in metadata)) {
            metadata[row[0]] = {};
        }
        metadata[row[0]][row[1]] = row[2];
    }, function (err) {
        if (err) return callback(err);
        callback(null, metadata);
    });
};

/**
 * Load published blog posts.
 *
 * @param {Object} blog_metadata
 * @param {Object} options (optional)
 * @param {Function} callback
 */

Loader.prototype.loadPosts = function (blog_metadata, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    var self = this, args = []
      , Post = this.options.Post;

    this.loadPostMeta(options.meta_keys || [], function (err, post_metadata) {
        if (err) return callback(err);

        var sql = self.sql(
            'SELECT post.ID, post.post_title, post.post_content, post.post_excerpt, ' +
            '    post.post_date_gmt, post.post_modified_gmt, post.post_name, ' +
            '   thumb.guid, thumb_meta.meta_value '
        );

        sql += self.sql(
            'FROM %s_posts post ' +
            'LEFT JOIN %s_postmeta thumb_id ON thumb_id.meta_key = "_thumbnail_id" ' +
            '    AND thumb_id.post_id = post.ID ' +
            'LEFT JOIN %s_posts thumb ON thumb_id.meta_value = thumb.ID ' +
            'LEFT JOIN %s_postmeta thumb_meta ON thumb.ID = thumb_meta.post_id ' +
            '    AND thumb_meta.meta_key = "crop" '
        );

        if (options.id) {
            sql += ' WHERE post.ID = ? LIMIT 1';
            args.push(options.id);
        } else {
            sql += ' WHERE post.post_status = "publish" AND post.post_type = "post"';
            if (options.since) {
                sql += ' AND (post.post_modified_gmt > ?';
                args.push(self.connection.date(options.since));
                if (options.scheduled && options.scheduled.length) {
                    sql += ' OR post.ID IN (' + options.scheduled.join(',') + ')';
                }
                sql += ')';
            }
            sql += ' ORDER BY post.post_date_gmt DESC';
        }
        var gallery_ids = /\[gallery ids="([0-9,]+?)"/g
          , gallery_images = {}
          , gallery_match
          , posts = [];
        self.connection.iter(sql, args, function (row) {
            var metadata = post_metadata[row[0]] || {}
              , content = row[2];
            if (content.indexOf('[gallery ids="') >= 0) {
                var gallery = metadata.gallery = {};
                while ((gallery_match = gallery_ids.exec(content))) {
                    gallery_match[1].split(',').forEach(function (id) {
                        gallery[id] = gallery_images[id] = null;
                    });
                }
            }
            metadata.thumbnail_crop = row[8];
            posts.push(new Post(row[0], row[1], content, row[3], new Date(row[4]),
                new Date(row[5]), row[6], row[7], metadata, blog_metadata));
        }, function (err) {
            if (err) return callback(err);
            gallery_images = Object.keys(gallery_images);
            if (!gallery_images.length) {
                return callback(null, posts);
            }
            self.loadImages(gallery_images, function (err, images) {
                if (err) return callback(err);
                posts.forEach(function (post) {
                    if (post.gallery) {
                        for (var id in post.gallery) {
                            post.gallery[id] = images[id];
                        }
                    }
                });
                callback(null, posts);
            });
        });
    });
};

/**
 * Load images and captions from the posts table.
 *
 * @param {Array} ids
 * @param {Function} callback
 */

Loader.prototype.loadImages = function (ids, callback) {
    var sql = this.sql(
        'SELECT ID, guid, post_excerpt, m.meta_value ' +
        'FROM %s_posts ' +
        'LEFT JOIN %s_postmeta m ON ID = m.post_id ' +
        ' AND m.meta_key = "_wp_attachment_metadata" ' +
        'WHERE ID IN (' + ids.join(',') + ')'
    );
    var images = {};
    this.connection.iter(sql, function (row) {
        var image = { url: row[1], caption: row[2] };
        if (row[3]) {
            var width = '', height = '', meta = row[3];
            if (/"width";s:[0-9]+?:"([0-9]+?)"/.test(meta)) {
                width = RegExp.$1;
            }
            if (/"height";s:[0-9]+?:"([0-9]+?)"/.test(meta)) {
                height = RegExp.$1;
            }
            if (width && height) {
                image.size = width + 'x' + height;
            }
        }
        images[row[0]] = image;
    }, function (err) {
        callback(err, images);
    });
};

/**
 * Load a single blog post
 *
 * @param {Number} id
 * @param {Object} blog_metadata
 * @param {Options} object
 * @param {Function} callback
 */

Loader.prototype.loadPost = function (id, blog_metadata, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    } else {
        options = utils.copy(options);
    }
    options.id = id;
    this.loadPosts(blog_metadata, options, function (err, posts) {
        if (err) return callback(err);
        callback(null, posts.shift());
    });
};

/**
 * Load unpublished blog posts.
 *
 * @param {Function} callback
 */

Loader.prototype.loadUnpublishedPosts = function (callback) {
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

Loader.prototype.load = function (callback) {
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
        }
    ], function (err, metadata, terms, relationships) {
        if (err) return callback(err);
        metadata = new Metadata(metadata, terms, self.options);
        self.loadPosts(metadata, {
            meta_keys: self.options.postmeta_keys
        }, function (err, posts) {
            self.addPostTerms(posts, terms, relationships);
            metadata.generateArchive(posts);
            callback(null, posts, metadata);
        });
    });
};

/**
 * Bind terms to post objects based on the specified relationships.
 *
 * @param {Array} posts
 * @param {Object} terms
 * @param {Object} relationships
 */

Loader.prototype.addPostTerms = function (posts, terms, relationships) {
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
 * Set an option local to a post.
 *
 * @param {Number} post_id
 * @param {String} key
 * @param {String} value
 * @param {Function} callback
 */

Loader.prototype.setPostMeta = function (post_id, key, value, callback) {
    //The index on post_id/meta_key is not unique, hence the delete + insert
    var sql = this.sql(
        'DELETE FROM %s_postmeta WHERE post_id = ? AND meta_key = ?; ' +
        'INSERT INTO %s_postmeta (post_id, meta_key, meta_value) ' +
        'VALUES (?, ?, ?)'
    );
    this.connection.query(sql, [ post_id, key, post_id, key, value ], callback);
};

/**
 * Set an option local to the blog.
 *
 * @param {String} key
 * @param {String} value
 * @param {Function} callback
 */

Loader.prototype.setOption = function (key, value, callback) {
    var sql = this.sql(
        'REPLACE INTO %s_options (option_name, option_value) ' +
        'VALUES (?, ?)'
    );
    this.connection.query(sql, [ key, value ], callback);
};

