var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils');

/**
 * Defaults
 */

var default_interval = 60 * 1000;

/**
 * Create a new Watcher instance.
 *
 * @param {MySQL} connection
 * @param {Object} options (optional)
 */

function Watcher(blog, options) {
    this.blog = blog;
    this.options = options || (options = {});
    this.interval = options.interval || default_interval;
    this.metadata = {};
    this.terms = {};
    this.scheduled_posts = {};
    this.published_posts = {};
    this.last_update = new Date();
    this.loadInitialState();
}

inherits(Watcher, EventEmitter);

exports.Watcher = Watcher;

/**
 * Load the initial blog state.
 */

Watcher.prototype.loadInitialState = function () {
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

Watcher.prototype.loadBlog = function (callback) {
    var self = this;
    this.blog.load(function (err, posts, metadata) {
        if (err) return callback(err);
        self.metadata = metadata;
        posts.forEach(function (post) {
            self.published_posts[post.id] = post;
        });
        self.emit('load', posts, metadata);
        callback();
    });
};

/**
 * Load the initial list of scheduled posts.
 *
 * @param {Function} callback
 */

Watcher.prototype.loadScheduledPosts = function (callback) {
    var self = this;
    this.blog.loadUnpublishedPosts(function (err, statuses) {
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

Watcher.prototype.start = function () {
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
    }, this.interval);
};

/**
 * Abort live polling.
 */

Watcher.prototype.abort = function () {
    this.abort_live = true;
};

/**
 * Poll the blog for changes.
 *
 * @param {Function} callback
 */

Watcher.prototype.poll = function (callback) {
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

Watcher.prototype.checkModifiedPosts = function (callback) {
    var last_update = this.last_update
      , self = this;
    this.last_update = new Date();
    this.blog.loadPosts(this.metadata, {
        since: last_update
      , meta_keys: self.blog.options.postmeta_keys
      , scheduled: Object.keys(self.scheduled_posts)
    }, function (err, posts) {
        if (err) return callback(err);
        var post_ids = posts.map(function (post) {
            return post.id;
        });
        self.blog.loadTermRelationships(post_ids, function (err, relationships) {
            if (err) return callback(err);
            self.blog.addPostTerms(posts, self.metadata.terms, relationships);
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

Watcher.prototype.checkUnpublishedPosts = function (callback) {
    var self = this;
    this.blog.loadUnpublishedPosts(function (err, statuses) {
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

Watcher.prototype.checkTerms = function (callback) {
    var self = this;
    this.blog.loadTerms(function (err, terms) {
        if (err) return callback(err);
        if (self.metadata.syncTerms(terms)) {
            self.emit('updated_terms', self.metadata.terms, self.metadata);
        }
        self.emit('updated_metadata', self.metadata);
        callback();
    });
};

/**
 * Check for changes in blog metadata.
 *
 * @param {Function} callback
 */

Watcher.prototype.checkMetadata = function (callback) {
    var self = this;
    this.blog.loadMetadata({
        keys: this.blog.options.option_keys
    }, function (err, metadata) {
        if (err) return callback(err);
        for (var key in metadata) {
            if (metadata[key] !== self.metadata[key]) {
                self.emit('updated_metadata_key', key, self.metadata[key], metadata[key]);
                self.metadata[key] = metadata[key];
            }
            self.emit('updated_metadata', self.metadata);
        }
        callback();
    });
};

