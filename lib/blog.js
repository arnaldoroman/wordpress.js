var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils')
  , Loader = require('./loader').Loader;

/**
 * Defaults
 */

var default_interval = 60 * 1000;

/**
 * Create a new Blog instance.
 *
 * @param {Connection} connection
 * @param {Object} options (optional)
 */

function Blog(connection, options) {
    this.options = options || (options = {});
    this.loader = new Loader(connection, options);
    this.metadata = {};
    this.terms = {};
    this.scheduled_posts = {};
    this.published_posts = {};
    this.last_update = new Date();
    this.loaded = false;
    this.loadInitialState();
}

inherits(Blog, EventEmitter);

exports.Blog = Blog;

/**
 * Load the initial blog state.
 */

Blog.prototype.loadInitialState = function () {
    var self = this;
    utils.parallel([
        this.loadBlog.bind(this)
      , this.loadScheduledPosts.bind(this)
    ], function (err) {
        if (err) {
            self.emit('error', err);
        }
        self.start();
    });
};

/**
 * Load the initial blog state - posts, metadata & terms.
 *
 * @param {Function} callback
 */

Blog.prototype.loadBlog = function (callback) {
    var self = this;
    this.loader.load(function (err, posts, metadata) {
        if (err) return callback(err);
        self.metadata = metadata;
        posts.forEach(function (post) {
            self.published_posts[post.id] = post;
        });
        self.loaded = true;
        self.emit('load', posts, metadata);
        callback();
    });
};

/**
 * Load the initial list of scheduled posts.
 *
 * @param {Function} callback
 */

Blog.prototype.loadScheduledPosts = function (callback) {
    var self = this;
    this.loader.loadUnpublishedPosts(function (err, statuses) {
        if (err) return callback(err);
        for (var id in statuses) {
            if (statuses[id] === 'future') {
                self.scheduled_posts[id] = true;
            }
        }
        callback();
    });
};

/**
 * Start polling the blog for changes.
 */

Blog.prototype.start = function () {
    var self = this;
    this.abort_live = false;
    utils.setInterval(function (next) {
        if (self.abort_live) {
            return;
        }
        self.poll(function (err) {
            if (err) {
                self.emit('error', err);
            }
            next();
        });
    }, this.options.interval || default_interval);
};

/**
 * Abort live polling.
 */

Blog.prototype.abort = function () {
    this.abort_live = true;
};

/**
 * Poll the blog for changes.
 *
 * @param {Function} callback
 */

Blog.prototype.poll = function (callback) {
    utils.parallel([
        this.checkModifiedPosts.bind(this)
      , this.checkUnpublishedPosts.bind(this)
      , this.checkTerms.bind(this)
      , this.checkMetadata.bind(this)
    ], callback);
};

/**
 * Check for new and modified posts.
 *
 * @param {Function} callback
 */

Blog.prototype.checkModifiedPosts = function (callback) {
    var last_update = this.last_update
      , self = this;
    this.last_update = new Date();
    this.loader.loadPosts(this.metadata, {
        since: last_update
      , meta_keys: self.options.postmeta_keys
      , scheduled: Object.keys(self.scheduled_posts)
    }, function (err, posts) {
        if (err) return callback(err);
        var post_ids = posts.map(function (post) {
            return post.id;
        });
        self.loader.loadTermRelationships(post_ids, function (err, relationships) {
            if (err) return callback(err);
            self.loader.addPostTerms(posts, self.metadata.terms, relationships);
            posts.forEach(function (post) {
                if (!(post.id in self.published_posts)) {
                    self.emit('new_post', post);
                    if (self.metadata.addArchivePost(post)) {
                        self.emit('updated_archive', self.metadata.archive);
                    }
                } else {
                    self.emit('updated_post', post);
                }
                self.published_posts[post.id] = post;
                delete self.scheduled_posts[post.id];
            });
            callback();
        });
    });
};

/**
 * Check unpublished posts and diff with the current state of
 * published/scheduled posts.
 *
 * @param {Function} callback
 */

Blog.prototype.checkUnpublishedPosts = function (callback) {
    var self = this;
    this.loader.loadUnpublishedPosts(function (err, statuses) {
        if (err) return callback(err);
        var post, id;
        for (id in statuses) {
            if (id in self.published_posts) {
                post = self.published_posts[id];
                delete self.published_posts[id];
                self.emit('removed_post', post);
                if (self.metadata.removeArchivePost(post)) {
                    self.emit('updated_archive', self.metadata.archive, self.metadata);
                }
            }
            if (statuses[id] === 'future') {
                self.scheduled_posts[id] = true;
                self.emit('scheduled_post', id);
            } else {
                delete self.scheduled_posts[id];
            }
        }
        callback();
    });
};

/**
 * Check for new and modified terms.
 *
 * @param {Function} callback
 */

Blog.prototype.checkTerms = function (callback) {
    var self = this;
    this.loader.loadTerms(function (err, terms) {
        if (err) return callback(err);
        if (self.metadata.syncTerms(terms)) {
            self.emit('updated_terms', self.metadata.terms, self.metadata);
        }
        callback();
    });
};

/**
 * Check for changes in blog metadata.
 *
 * @param {Function} callback
 */

Blog.prototype.checkMetadata = function (callback) {
    var self = this;
    this.loader.loadMetadata({
        keys: this.options.option_keys
    }, function (err, metadata) {
        if (err) return callback(err);
        if (self.metadata.update(metadata)) {
            self.emit('updated_metadata', self.metadata);
        }
        callback();
    });
};

/**
 * Load a single blog post.
 *
 * @param {Number} id
 * @param {Function} callback
 */

Blog.prototype.loadPost = function (id, callback) {
    var self = this;
    if (!this.loaded) {
        return this.on('load', function () {
            return self.loadPost(id, callback);
        });
    }
    this.loader.loadPost(id, this.metadata, {
        meta_keys: this.options.postmeta_keys
    }, function (err, post) {
        if (err || !post) {
            return callback(err);
        }
        self.loader.loadTermRelationships([ post.id ], function (err, relationships) {
            if (err) return callback(err);
            self.loader.addPostTerms([ post ], self.metadata.terms, relationships);
            callback(null, post);
        });
    });
};

/**
 * Set an option local to the blog.
 *
 * @param {String} key
 * @param {String} value
 */

Blog.prototype.setOption = function (key, value, callback) {
    this.loader.setOption(key, value, callback);
};

/**
 * Set an option local to a post.
 *
 * @param {String} key
 * @param {String} value
 */

Blog.prototype.setPostOption = function (post_id, key, value, callback) {
    this.loader.setPostMeta(post_id, key, value, callback);
};

