/*jshint -W015 */

var assert = require('assert')
  , wordpress = require('../lib/wordpress')
  , inherits = require('util').inherits
  , fs = require('fs');

var config = require('../test_config.js')
  , db = new wordpress.MySQL(config);

function getBlog(name, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    var multisite = new wordpress.Multisite(db, options);
    multisite.getBlogs(function (err, blogs) {
        if (err) return callback(err);
        for (var i = 0; i < blogs.length; i++) {
            if (blogs[i].name === name) {
                return callback(null, blogs[i]);
            }
        }
        callback(new Error('Blog not found'));
    });
}

function getBlogWatcher(name, options, callback) {
    getBlog(name, options, function (err, blog) {
        if (err) return callback(err);
        callback(null, new wordpress.Watcher(blog));
    });
}

describe('Wordpress', function () {

    before(function (callback) {
        db.connect(function (err) {
            if (err) return callback(err);
            fs.readFile(__dirname + '/fixtures.sql', function (err, fixtures) {
                if (err) return callback(err);
                db.query(fixtures.toString(), callback);
            });
        });
    });

    describe('Multisite', function () {

        it('should load all blogs', function (done) {
            var multisite = new wordpress.Multisite(db);
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                assert(Array.isArray(blogs));
                assert.equal(blogs.length, 2);
                assert.equal(blogs[0].id, 2);
                assert.equal(blogs[0].name, 'foo');
                assert.equal(blogs[0].public, true);
                assert.equal(blogs[1].id, 3);
                assert.equal(blogs[1].name, 'bar');
                assert.equal(blogs[1].public, true);
                done();
            });
        });

        it('should accept and use a database name', function (done) {
            var multisite = new wordpress.Multisite(db, { database: config.db });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                assert(Array.isArray(blogs));
                assert.equal(blogs.length, 2);
                assert.equal(blogs[0].id, 2);
                assert.equal(blogs[1].id, 3);
                done();
            });
        });

    });

    describe('Blog', function () {

        it('should load metadata', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadMetadata(function (err, metadata) {
                    if (err) return done(err);
                    assert.equal(typeof metadata, 'object');
                    assert.equal(metadata.twitter, 'bacon');
                    assert.equal(Object.keys(metadata).length, 123);
                    done();
                });
            });
        });

        it('should load metadata using a mask', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadMetadata({ keys: [ 'twitter' ] }, function (err, metadata) {
                    if (err) return done(err);
                    assert.equal(typeof metadata, 'object');
                    assert.equal(metadata.twitter, 'bacon');
                    assert.equal(Object.keys(metadata).length, 1);
                    done();
                });
            });
        });

        it('should load categories and tags', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadTerms(function (err, terms) {
                    if (err) return done(err);
                    assert(typeof terms, 'object');
                    assert(Object.keys(terms).length, 11);
                    assert(terms['3'] instanceof wordpress.Category);
                    assert(terms['7'] instanceof wordpress.Tag);
                    var tag = terms['7']
                      , category = terms['3']
                      , subcategory = terms['100']
                      , subsubcategory = terms['101'];
                    assert.equal(tag.name, 'Awesome');
                    assert.equal(tag.slug, 'awesome');
                    assert.equal(category.name, 'Shopping');
                    assert.equal(category.slug, 'shopping');
                    assert(Array.isArray(category.children));
                    assert.equal(category.children[0], subcategory);
                    assert.equal(subcategory.name, 'Subcategory');
                    assert.equal(subcategory.parent, category);
                    assert(Array.isArray(subcategory.children));
                    assert.equal(subcategory.children[0], subsubcategory);
                    assert.equal(subsubcategory.name, 'Subsubcategory');
                    assert.equal(subsubcategory.children, null);
                    assert.equal(subsubcategory.parent, subcategory);
                    assert.equal(subsubcategory.parent.parent, category);
                    done();
                });
            });
        });

        it('should load post to term relationships', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadTermRelationships(function (err, relationships) {
                    if (err) return done(err);
                    assert.deepEqual(relationships, {
                        '1': [ '2', '3', '4' ]
                      , '2': [ '3', '6', '7', '8' ]
                      , '3': [ '7', '10', '11' ]
                    });
                    done();
                });
            });
        });

        it('should load post to term relationships using an ID mask', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadTermRelationships([ 1, 2 ], function (err, relationships) {
                    if (err) return done(err);
                    assert.deepEqual(relationships, {
                        '1': [ '2', '3', '4' ]
                      , '2': [ '3', '6', '7', '8' ]
                    });
                    done();
                });
            });
        });

        it('should load posts', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPosts(function (err, posts) {
                    if (err) return done(err);
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    posts.forEach(function (post) {
                        assert(post instanceof wordpress.Post);
                        assert(post.date instanceof Date);
                        assert(post.modified instanceof Date);
                        assert.equal(Object.keys(post).length, 8);
                    });
                    assert(posts[0].date > posts[1].date && posts[1].date > posts[2].date);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.slug, '/2011/11/bacon-ipsum');
                    assert.equal(post.title, 'Bacon ipsum');
                    assert.equal(post.image, '/foo/files/2011/01/2.jpg');
                    assert.equal(post.excerpt, 'Has anyone really been far even as decided to ' +
                        'use even go want to do look more like?');
                    post = posts[2];
                    assert.equal(post.id, '2');
                    assert.equal(post.slug, '/2009/08/ham-andouille-speck');
                    assert.equal(post.title, 'Ham andouille speck');
                    assert.equal(post.image, '/foo/files/2011/01/2.jpg');
                    done();
                });
            });
        });

        it('should load post metadata when keys are specified', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPosts({ meta_keys: [ 'orientation', 'original_title' ] }, function (err, posts) {
                    if (err) return done(err);
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.meta_orientation, 'top');
                    assert.equal(post.meta_original_title, post.title);
                    done();
                });
            });
        });

        it('should load a post by ID', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(1, function (err, post) {
                    if (err) return done(err);
                    assert.equal(typeof post, 'object');
                    assert.equal(post.id, '1');
                    assert.equal(post.slug, '/2011/11/bacon-ipsum');
                    done();
                });
            });
        });

        it('should load a post by ID with metadata', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(1, { meta_keys: [ 'orientation' ] }, function (err, post) {
                    if (err) return done(err);
                    assert.equal(typeof post, 'object');
                    assert.equal(post.id, '1');
                    assert.equal(post.slug, '/2011/11/bacon-ipsum');
                    assert.equal(post.meta_orientation, 'top');
                    done();
                });
            });
        });

        it('should generate an excerpt from the content', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(3, function (err, post) {
                    if (err) return done(err);
                    assert.equal(post.excerpt, 'Shankle brisket pancetta leberkas. ' +
                        'Bresaola sirloin pork chop ribeye beef ham...');
                    done();
                });
            });
        });

        it('should return null when a post doesn\'t exist', function (done) {
            getBlog('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(9999, function (err, post) {
                    if (err) return done(err);
                    assert.equal(post, null);
                    done();
                });
            });
        });

        it('should allow for a custom Post type', function (done) {
            function MyPost() {
                wordpress.Post.apply(this, arguments);
            }
            inherits(MyPost, wordpress.Post);
            getBlog('foo', { Post: MyPost }, function (err, foo) {
                if (err) return done(err);
                foo.loadPosts(function (err, posts) {
                    if (err) return done(err);
                    assert.equal(posts.length, 3);
                    posts.forEach(function (post) {
                        assert(post instanceof MyPost);
                        assert(post instanceof wordpress.Post);
                    });
                    done();
                });
            });
        });

        it('should allow for custom Tag and Category types', function (done) {
            function MyTag() {
                wordpress.Tag.apply(this, arguments);
            }
            function MyCategory() {
                wordpress.Category.apply(this, arguments);
            }
            inherits(MyTag, wordpress.Tag);
            inherits(MyCategory, wordpress.Category);
            getBlog('foo', {
                Tag: MyTag
              , Category: MyCategory
            }, function (err, foo) {
                if (err) return done(err);
                foo.loadTerms(function (err, terms) {
                    if (err) return done(err);
                    assert(terms['3'] instanceof MyCategory);
                    assert(terms['3'] instanceof wordpress.Category);
                    assert(terms['7'] instanceof MyTag);
                    assert(terms['7'] instanceof wordpress.Tag);
                    done();
                });
            });
        });

        it('should load an entire blog', function (done) {
            getBlog('foo', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, foo) {
                if (err) return done(err);
                foo.load(function (err, posts, metadata, terms) {
                    if (err) return done(err);
                    assert.equal(typeof metadata, 'object');
                    assert.equal(Object.keys(metadata).length, 1);
                    assert.equal(metadata.pinterest, 'bacon');
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    assert(posts[0].date > posts[1].date && posts[1].date > posts[2].date);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.title, 'Bacon ipsum');
                    assert.equal(post.meta_orientation, 'top');
                    assert(Array.isArray(post.tags));
                    assert(Array.isArray(post.categories));
                    assert.equal(post.tags.length, 1);
                    assert.equal(post.categories.length, 2);
                    assert.equal(post.tags[0].name, 'Radical');
                    assert.equal(post.categories[1].name, 'Shopping');
                    assert(Array.isArray(post.categories[1].children));
                    assert.equal(post.categories[1].children.length, 1);
                    assert(typeof terms, 'object');
                    assert(Object.keys(terms).length, 11);
                    assert(terms['3'] instanceof wordpress.Category);
                    assert(terms['7'] instanceof wordpress.Tag);
                    done();
                });
            });
        });

    });

    describe('Watcher', function () {

        it('should emit a blog event when load is complete', function (done) {
            getBlogWatcher('foo', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                if (err) return done(err);
                watcher.on('blog', function (posts, metadata, terms) {
                    assert.equal(typeof metadata, 'object');
                    assert.equal(Object.keys(metadata).length, 1);
                    assert.equal(metadata.pinterest, 'bacon');
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    assert(posts[0].date > posts[1].date && posts[1].date > posts[2].date);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.title, 'Bacon ipsum');
                    assert.equal(post.meta_orientation, 'top');
                    assert(Array.isArray(post.tags));
                    assert(Array.isArray(post.categories));
                    assert.equal(post.tags.length, 1);
                    assert.equal(post.categories.length, 2);
                    assert.equal(post.tags[0].name, 'Radical');
                    assert.equal(post.categories[1].name, 'Shopping');
                    assert(Array.isArray(post.categories[1].children));
                    assert.equal(post.categories[1].children.length, 1);
                    assert(typeof terms, 'object');
                    assert(Object.keys(terms).length, 11);
                    assert(terms['3'] instanceof wordpress.Category);
                    assert(terms['7'] instanceof wordpress.Tag);
                    done();
                });
                watcher.on('error', done);
                watcher.abort();
            });
        });

        it('should pick up new posts', function (done) {
            db.query(function () {/*
                UPDATE wp_3_posts
                SET post_status = "draft",
                    post_modified_gmt = NOW()
                WHERE ID = 3
            */}, function (err) {
                if (err) return done(err);
                getBlogWatcher('bar', {
                    postmeta_keys: [ 'orientation' ]
                  , option_keys: [ 'pinterest' ]
                }, function (err, watcher) {
                    var new_post = null;
                    watcher.on('blog', function (posts) {
                        assert.equal(posts.length, 2);
                        db.query(function () {/*
                            UPDATE wp_3_posts
                            SET post_status = "publish",
                                post_modified_gmt = NOW()
                            WHERE ID = 3
                        */}, function (err) {
                            if (err) return done(err);
                            watcher.poll(function (err) {
                                if (err) return done(err);
                                setTimeout(function () {
                                    assert(new_post);
                                    assert.equal(new_post.id, '3');
                                    assert.equal(new_post.meta_orientation, 'top');

                                    done();
                                }, 100);
                            });
                        });
                    });
                    watcher.on('new_post', function (post) {
                        new_post = post;
                    });
                    watcher.abort();
                });
            });
        });

        it('should pick up updated posts', function (done) {
            getBlogWatcher('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var updated_post = null;
                watcher.on('blog', function (posts) {
                    assert.equal(posts.length, 3);
                    db.query(function () {/*
                        UPDATE wp_3_posts
                        SET post_content = "foo",
                            post_modified_gmt = NOW()
                        WHERE ID = 3
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_post);
                                assert.equal(updated_post.id, '3');
                                assert.equal(updated_post.content, 'foo');
                                assert.equal(updated_post.meta_orientation, 'top');
                                done();
                            }, 100);
                        });
                    });
                });
                watcher.on('updated_post', function (post) {
                    updated_post = post;
                });
                watcher.abort();
            });
        });

        it('should remove posts that are drafted or trashed after publishing', function (done) {
            getBlogWatcher('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var removed_post = null;
                watcher.on('blog', function (posts) {
                    assert.equal(posts.length, 3);
                    db.query(function () {/*
                        UPDATE wp_3_posts
                        SET post_status = "draft",
                            post_modified_gmt = NOW()
                        WHERE ID = 3
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(removed_post);
                                assert.equal(removed_post.id, '3');
                                done();
                            }, 100);
                        });
                    });
                });
                watcher.on('removed_post', function (post) {
                    removed_post = post;
                });
                watcher.abort();
            });
        });

        it('should pick up scheduled posts before initial load that are later published', function (done) {
            db.query(function () {/*
                UPDATE wp_3_posts
                SET post_status = "future"
                WHERE ID = 3
            */}, function (err) {
                if (err) return done(err);
                getBlogWatcher('bar', {
                    postmeta_keys: [ 'orientation' ]
                  , option_keys: [ 'pinterest' ]
                }, function (err, watcher) {
                    var new_post = null;
                    watcher.on('blog', function (posts) {
                        assert.equal(posts.length, 2);
                        db.query(function () {/*
                            UPDATE wp_3_posts
                            SET post_status = "publish"
                            WHERE ID = 3
                        */}, function (err) {
                            if (err) return done(err);
                            watcher.poll(function (err) {
                                if (err) return done(err);
                                setTimeout(function () {
                                    assert(new_post);
                                    assert.equal(new_post.id, '3');
                                    assert.equal(new_post.meta_orientation, 'top');
                                    done();
                                }, 100);
                            });
                        });
                    });
                    watcher.on('new_post', function (post) {
                        new_post = post;
                    });
                    watcher.abort();
                });
            });
        });

        it('should pick up scheduled posts after initial load that are later published', function (done) {
            getBlogWatcher('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var removed_post = null
                  , new_post = null;
                watcher.on('blog', function (posts) {
                    assert.equal(posts.length, 3);
                    db.query(function () {/*
                        UPDATE wp_3_posts
                        SET post_status = "future",
                            post_modified_gmt = NOW()
                        WHERE ID = 3
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(removed_post);
                                assert.equal(removed_post.id, '3');
                                db.query(function () {/*
                                    UPDATE wp_3_posts
                                    SET post_status = "publish"
                                    WHERE ID = 3
                                */}, function (err) {
                                    if (err) return done(err);
                                    watcher.poll(function (err) {
                                        if (err) return done(err);
                                        setTimeout(function () {
                                            assert(new_post);
                                            assert.equal(new_post.id, '3');
                                            assert.equal(new_post.meta_orientation, 'top');
                                            done();
                                        }, 100);
                                    });
                                });
                            }, 100);
                        });
                    });
                });
                watcher.on('new_post', function (post) {
                    new_post = post;
                });
                watcher.on('removed_post', function (post) {
                    removed_post = post;
                });
                watcher.abort();
            });
        });

        it('should detect changes to blog metadata', function (done) {
            getBlogWatcher('bar', {
                option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var key, previous, current;
                watcher.on('blog', function (posts, metadata) {
                    assert.equal(metadata.pinterest, 'bacon');
                    db.query(function () {/*
                        UPDATE wp_3_options
                        SET option_value = "foobar"
                        WHERE option_name = "pinterest"
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(key && previous && current);
                                assert.equal(key, 'pinterest');
                                assert.equal(previous, 'bacon');
                                assert.equal(current, 'foobar');
                                assert.equal(metadata.pinterest, 'foobar');
                                done();
                            }, 100);
                        });
                    });
                });
                watcher.on('updated_metadata', function (key_, previous_, current_) {
                    key = key_;
                    previous = previous_;
                    current = current_;
                });
                watcher.abort();
            });
        });

        it('should detect changes to terms', function (done) {
            getBlogWatcher('bar', {
                option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var updated_terms = null;
                watcher.on('blog', function (posts, metadata, terms) {
                    assert.deepEqual(Object.keys(terms), [ '1', '2', '3',
                        '4', '5', '6', '7', '10' ]);
                    db.query(function () {/*
                        INSERT INTO wp_3_terms VALUES (100, 'Foo', 'foo', 0);
                        INSERT INTO wp_3_term_taxonomy VALUES (100, 100, 'category', '', 6, 0)
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_terms);
                                assert.deepEqual(Object.keys(updated_terms), [ '1', '2', '3',
                                    '4', '5', '6', '7', '10', '100' ]);
                                assert.equal(updated_terms['100'].name, 'Foo');
                                assert.equal(updated_terms['100'].slug, 'foo');
                                assert.equal(updated_terms['100'].parent.name, updated_terms['6'].name);
                                assert.equal(updated_terms['6'].children[0], updated_terms['100']);
                                assert.equal(terms['100'].name, 'Foo');
                                assert.equal(terms['100'].slug, 'foo');
                                assert.equal(terms['100'].parent.name, terms['6'].name);
                                assert.equal(terms['6'].children[0], terms['100']);
                                done();
                            }, 100);
                        });
                    });
                });
                watcher.on('updated_terms', function (terms) {
                    updated_terms = terms;
                });
                watcher.abort();
            });
        });

        it('should pick up modifications to post terms', function (done) {
            getBlogWatcher('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, watcher) {
                var updated_post = null;
                watcher.on('blog', function (posts) {
                    assert.equal(posts.length, 3);
                    var post = posts[2];
                    assert.equal(post.id, '3');
                    assert.deepEqual(post.categories.map(function (cat) {
                        return cat.name;
                    }), [ 'Advertorial', 'Travel' ]);
                    db.query(function () {/*
                        UPDATE wp_3_posts
                        SET post_modified_gmt = NOW()
                        WHERE ID = 3;
                        INSERT INTO wp_3_term_relationships VALUES (3,6,0)
                    */}, function (err) {
                        if (err) return done(err);
                        watcher.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_post);
                                assert.equal(updated_post.id, '3');
                                assert.deepEqual(updated_post.categories.map(function (cat) {
                                    return cat.name;
                                }), [ 'Advertorial', 'News', 'Travel' ]);
                                done();
                            }, 100);
                        });
                    });
                });
                watcher.on('updated_post', function (post) {
                    updated_post = post;
                });
                watcher.abort();
            });
        });

    });

});

/*jshint +W015 */

