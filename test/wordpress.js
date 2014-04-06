var assert = require('assert')
  , wordpress = require('../lib/wordpress')
  , inherits = require('util').inherits
  , fs = require('fs');

var config = require('../test_config.js')
  , db = new wordpress.Connection(config);

function getLoader(name, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options.id = name === 'foo' ? 2 : 3;
    callback(null, new wordpress.Loader(db, options));
}

function getBlog(name, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    var multisite = new wordpress.Multisite(db, options);
    multisite.getBlogs(function (err, blogs) {
        if (err) return callback(err);
        for (var i = 0; i < blogs.length; i++) {
            if (blogs[i].options.name === name) {
                return callback(null, blogs[i]);
            }
        }
        callback(new Error('Blog not found'));
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
                assert.equal(blogs[0].options.id, 2);
                assert.equal(blogs[0].options.name, 'foo');
                assert.equal(blogs[0].options.public, true);
                assert.equal(blogs[1].options.id, 3);
                assert.equal(blogs[1].options.name, 'bar');
                assert.equal(blogs[1].options.public, true);
                done();
            });
        });

        it('should accept and use a database name', function (done) {
            var multisite = new wordpress.Multisite(db, { database: config.db });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                assert(Array.isArray(blogs));
                assert.equal(blogs.length, 2);
                assert.equal(blogs[0].options.id, 2);
                assert.equal(blogs[1].options.id, 3);
                done();
            });
        });

    });

    describe('Blog', function () {

        it('should load metadata', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadMetadata(function (err, metadata) {
                    if (err) return done(err);
                    assert.equal(typeof metadata, 'object');
                    assert.equal(metadata.twitter, 'bacon');
                    assert.equal(Object.keys(metadata).length, 119);
                    done();
                });
            });
        });

        it('should load metadata using a mask', function (done) {
            getLoader('foo', function (err, foo) {
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
            getLoader('foo', function (err, foo) {
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
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadTermRelationships(function (err, relationships) {
                    if (err) return done(err);
                    assert.deepEqual(relationships, {
                        '1': [ '2', '3', '4' ]
                      , '2': [ '3', '6', '7', '8' ]
                      , '3': [ '7', '10', '11', '14', '15' ]
                    });
                    done();
                });
            });
        });

        it('should load post to term relationships using an ID mask', function (done) {
            getLoader('foo', function (err, foo) {
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
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPosts({ foo: 'bar' }, function (err, posts) {
                    if (err) return done(err);
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    posts.forEach(function (post) {
                        assert(post instanceof wordpress.Post);
                        assert(post.date instanceof Date);
                        assert(post.modified instanceof Date);
                        assert.equal(Object.keys(post).length, 11);
                        assert.equal(post.blog.foo, 'bar');
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
                    assert.equal(post.thumbnail_size, '880x587');
                    done();
                });
            });
        });

        it('should load post metadata when keys are specified', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPosts({ foo: 'bar' }, { meta_keys: [ 'orientation', 'original_title' ] }, function (err, posts) {
                    if (err) return done(err);
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.orientation, 'top');
                    assert.equal(post.original_title, post.title);
                    assert.equal(post.blog.foo, 'bar');
                    done();
                });
            });
        });

        it('should load a post by ID', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(1, { foo: 'bar' }, function (err, post) {
                    if (err) return done(err);
                    assert.equal(typeof post, 'object');
                    assert.equal(post.id, '1');
                    assert.equal(post.slug, '/2011/11/bacon-ipsum');
                    assert.equal(post.blog.foo, 'bar');
                    done();
                });
            });
        });

        it('should load a post by ID with metadata', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(1, { foo: 'bar' }, { meta_keys: [ 'orientation' ] }, function (err, post) {
                    if (err) return done(err);
                    assert.equal(typeof post, 'object');
                    assert.equal(post.id, '1');
                    assert.equal(post.slug, '/2011/11/bacon-ipsum');
                    assert.equal(post.orientation, 'top');
                    assert.equal(post.blog.foo, 'bar');
                    done();
                });
            });
        });

        it('should generate an excerpt from the content', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(3, {}, function (err, post) {
                    if (err) return done(err);
                    assert.equal(post.excerpt, 'Shankle brisket pancetta leberkas. ' +
                        'Bresaola sirloin pork chop ribeye beef ham...');
                    assert.equal(post.excerpt, 'Shankle brisket pancetta leberkas. ' +
                        'Bresaola sirloin pork chop ribeye beef ham...');
                    done();
                });
            });
        });

        it('should return null when a post doesn\'t exist', function (done) {
            getLoader('foo', function (err, foo) {
                if (err) return done(err);
                foo.loadPost(9999, {}, function (err, post) {
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
            getLoader('foo', { Post: MyPost }, function (err, foo) {
                if (err) return done(err);
                foo.loadPosts({ foo: 'bar' }, function (err, posts) {
                    if (err) return done(err);
                    assert.equal(posts.length, 3);
                    posts.forEach(function (post) {
                        assert(post instanceof MyPost);
                        assert(post instanceof wordpress.Post);
                        assert(post.blog.foo, 'bar');
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
            getLoader('foo', {
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
            getLoader('foo', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, foo) {
                if (err) return done(err);
                foo.load(function (err, posts, metadata) {
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
                    assert.equal(post.orientation, 'top');
                    assert(Array.isArray(post.tags));
                    assert(Array.isArray(post.categories));
                    assert.equal(post.tags.length, 1);
                    assert.equal(post.categories.length, 2);
                    assert.equal(post.tags[0].name, 'Radical');
                    assert.equal(post.categories[1].name, 'Shopping');
                    assert(Array.isArray(post.categories[1].children));
                    assert.equal(post.categories[1].children.length, 1);
                    assert(typeof metadata.terms, 'object');
                    assert(Object.keys(metadata.terms).length, 11);
                    assert(metadata.terms['3'] instanceof wordpress.Category);
                    assert(metadata.terms['7'] instanceof wordpress.Tag);
                    assert(Array.isArray(metadata.categories));
                    assert(Array.isArray(metadata.tags));
                    assert.equal(Object.keys(metadata.category_slugs).length, 9);
                    assert.equal(typeof metadata.category_slugs, 'object');
                    assert.equal(metadata.categories.length, 9);
                    assert.equal(metadata.tags.length, 3);
                    assert.equal(metadata.categories[0].slug, 'accessories');
                    assert.equal(metadata.categories[0].taxonomy, 'category');
                    assert.equal(metadata.category_slugs['baz-foo'].taxonomy, 'photographer');
                    assert.equal(metadata.tags[0].slug, 'radical');
                    assert.equal(metadata.category_slugs['uncategorized'].name, 'Uncategorized');
                    done();
                });
            });
        });

        it('should load gallery metadata', function (done) {
            getLoader('bar', function (err, foo) {
                if (err) return done(err);
                foo.loadPosts({}, function (err, posts) {
                    if (err) return done(err);
                    assert(Array.isArray(posts));
                    posts.forEach(function (post) {
                        if (post.gallery) {
                            assert.equal(post.id, 3);
                        }
                    });
                    assert.deepEqual(posts[2].gallery, {
                        '100': { url: 'http://example.com/foo.jpg', caption: 'caption1' }
                      , '101': { url: 'http://example.com/bar.jpg', caption: 'caption2' }
                      , '102': { url: 'http://example.com/baz.jpg', caption: 'caption3' }
                      , '103': { url: 'http://example.com/qux.jpg', caption: 'caption4', size: '880x587' }
                    });
                    done();
                });
            });
        });

    });

    describe('blog', function () {

        it('should emit a blog event when load is complete', function (done) {
            getBlog('foo', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                if (err) return done(err);
                blog.on('load', function (posts, metadata) {
                    assert.equal(typeof metadata, 'object');
                    assert.equal(Object.keys(metadata).length, 1);
                    assert.equal(metadata.pinterest, 'bacon');
                    assert(Array.isArray(posts));
                    assert.equal(posts.length, 3);
                    assert(posts[0].date > posts[1].date && posts[1].date > posts[2].date);
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.title, 'Bacon ipsum');
                    assert.equal(post.orientation, 'top');
                    assert(Array.isArray(post.tags));
                    assert(Array.isArray(post.categories));
                    assert.equal(post.tags.length, 1);
                    assert.equal(post.categories.length, 2);
                    assert.equal(post.tags[0].name, 'Radical');
                    assert.equal(post.categories[1].name, 'Shopping');
                    assert(Array.isArray(post.categories[1].children));
                    assert.equal(post.categories[1].children.length, 1);
                    assert(typeof metadata.terms, 'object');
                    assert(Object.keys(metadata.terms).length, 11);
                    assert(metadata.terms['3'] instanceof wordpress.Category);
                    assert(metadata.terms['7'] instanceof wordpress.Tag);
                    done();
                });
                blog.on('error', done);
                blog.abort();
            });
        });

        it('should pick up new posts', function (done) {
            var hours = new Date().getTimezoneOffset() / 60;
            db.query(
                'UPDATE wp_3_posts ' +
                'SET post_status = "draft", ' +
                '    post_modified_gmt = DATE_SUB(NOW(), ' +
                '    INTERVAL ' + hours + ' HOUR) ' +
                'WHERE ID = 3'
            , function (err) {
                if (err) return done(err);
                getBlog('bar', {
                    postmeta_keys: [ 'orientation' ]
                  , option_keys: [ 'pinterest' ]
                }, function (err, blog) {
                    var new_post = null;
                    blog.on('load', function (posts) {
                        assert.equal(posts.length, 2);
                        db.query(
                            'UPDATE wp_3_posts ' +
                            'SET post_status = "publish", ' +
                            '    post_modified_gmt = DATE_SUB(NOW(), ' +
                            '    INTERVAL ' + hours + ' HOUR) ' +
                            'WHERE ID = 3'
                        , function (err) {
                            if (err) return done(err);
                            blog.poll(function (err) {
                                if (err) return done(err);
                                setTimeout(function () {
                                    assert(new_post);
                                    assert.equal(new_post.id, '3');
                                    assert.equal(new_post.orientation, 'top');

                                    done();
                                }, 100);
                            });
                        });
                    });
                    blog.on('new_post', function (post) {
                        new_post = post;
                    });
                    blog.abort();
                });
            });
        });

        it('should poll for changes periodically', function (done) {
            var hours = new Date().getTimezoneOffset() / 60;
            db.query(
                'UPDATE wp_3_posts ' +
                'SET post_status = "draft", ' +
                '    post_modified_gmt = DATE_SUB(NOW(), ' +
                '    INTERVAL ' + hours + ' HOUR) ' +
                'WHERE ID = 3'
            , function (err) {
                if (err) return done(err);
                getBlog('bar', {
                    postmeta_keys: [ 'orientation' ]
                  , option_keys: [ 'pinterest' ]
                  , interval: 50
                }, function (err, blog) {
                    var new_post = null;
                    blog.on('load', function (posts) {
                        assert.equal(posts.length, 2);
                        db.query(
                            'UPDATE wp_3_posts ' +
                            'SET post_status = "publish", ' +
                            '    post_modified_gmt = DATE_SUB(NOW(), ' +
                            '    INTERVAL ' + hours + ' HOUR) ' +
                            'WHERE ID = 3'
                        , function (err) {
                            if (err) return done(err);
                            blog.start();
                            setTimeout(function () {
                                assert(new_post);
                                assert.equal(new_post.id, '3');
                                assert.equal(new_post.orientation, 'top');
                                blog.abort();
                                done();
                            }, 100);
                        });
                    });
                    blog.on('new_post', function (post) {
                        new_post = post;
                    });
                    blog.abort();
                });
            });
        });

        it('should pick up updated posts', function (done) {
            var hours = new Date().getTimezoneOffset() / 60;
            getBlog('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var updated_post = null;
                blog.on('load', function (posts) {
                    assert.equal(posts.length, 3);
                    db.query(
                        'UPDATE wp_3_posts ' +
                        'SET post_content = "foo", ' +
                        '    post_modified_gmt = DATE_SUB(NOW(), ' +
                        '    INTERVAL ' + hours + ' HOUR) ' +
                        'WHERE ID = 3'
                    , function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_post);
                                assert.equal(updated_post.id, '3');
                                assert.equal(updated_post.content, 'foo');
                                assert.equal(updated_post.orientation, 'top');
                                done();
                            }, 100);
                        });
                    });
                });
                blog.on('updated_post', function (post) {
                    updated_post = post;
                });
                blog.abort();
            });
        });

        it('should remove posts that are drafted or trashed after publishing', function (done) {
            getBlog('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var removed_post = null;
                blog.on('load', function (posts) {
                    assert.equal(posts.length, 3);
                    db.query(
                        'UPDATE wp_3_posts ' +
                        'SET post_status = "draft", ' +
                        '    post_modified_gmt = NOW() ' +
                        'WHERE ID = 3'
                    , function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(removed_post);
                                assert.equal(removed_post.id, '3');
                                done();
                            }, 100);
                        });
                    });
                });
                blog.on('removed_post', function (post) {
                    removed_post = post;
                });
                blog.abort();
            });
        });

        it('should pick up scheduled posts before initial load that are later published', function (done) {
            db.query(
                'UPDATE wp_3_posts ' +
                'SET post_status = "future" ' +
                'WHERE ID = 3'
            , function (err) {
                if (err) return done(err);
                getBlog('bar', {
                    postmeta_keys: [ 'orientation' ]
                  , option_keys: [ 'pinterest' ]
                }, function (err, blog) {
                    var new_post = null;
                    blog.on('load', function (posts) {
                        assert.equal(posts.length, 2);
                        db.query(
                            'UPDATE wp_3_posts ' +
                            'SET post_status = "publish" ' +
                            'WHERE ID = 3'
                        , function (err) {
                            if (err) return done(err);
                            blog.poll(function (err) {
                                if (err) return done(err);
                                setTimeout(function () {
                                    assert(new_post);
                                    assert.equal(new_post.id, '3');
                                    assert.equal(new_post.orientation, 'top');
                                    done();
                                }, 100);
                            });
                        });
                    });
                    blog.on('new_post', function (post) {
                        new_post = post;
                    });
                    blog.abort();
                });
            });
        });

        it('should pick up scheduled posts after initial load that are later published', function (done) {
            getBlog('bar', {
                postmeta_keys: [ 'orientation', 'foobar' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var removed_post = null
                  , new_post = null
                  , scheduled_post = null;
                blog.on('load', function () {
                    db.query(
                        'UPDATE wp_3_posts ' +
                        'SET post_status = "future", ' +
                        '    post_modified_gmt = NOW() ' +
                        'WHERE ID = 3'
                    , function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(removed_post);
                                assert.equal(removed_post.id, '3');
                                assert.equal(scheduled_post, '3');
                                blog.setPostOption(3, 'foobar', 'baz', function (err) {
                                    if (err) return done(err);
                                    db.query(
                                        'UPDATE wp_3_posts ' +
                                        'SET post_status = "publish" ' +
                                        'WHERE ID = 3'
                                    , function (err) {
                                        if (err) return done(err);
                                        blog.poll(function (err) {
                                            if (err) return done(err);
                                            setTimeout(function () {
                                                assert(new_post);
                                                assert.equal(new_post.id, '3');
                                                assert.equal(new_post.orientation, 'top');
                                                assert.equal(new_post.foobar, 'baz');
                                                done();
                                            }, 100);
                                        });
                                    });
                                });
                            }, 100);
                        });
                    });
                });
                blog.on('new_post', function (post) {
                    new_post = post;
                });
                blog.on('removed_post', function (post) {
                    removed_post = post;
                });
                blog.on('scheduled_post', function (post) {
                    scheduled_post = post;
                });
                blog.abort();
            });
        });

        it('should detect changes to blog metadata', function (done) {
            getBlog('bar', {
                option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var updated_metadata;
                blog.on('load', function (posts, metadata) {
                    var post = posts[0];
                    assert.equal(metadata.pinterest, 'bacon');
                    assert.equal(post.blog.pinterest, 'bacon');
                    blog.setOption('pinterest', 'foobar', function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_metadata);
                                assert.equal(updated_metadata.pinterest, 'foobar');
                                assert.equal(post.blog.pinterest, 'foobar');
                                assert.equal(metadata.options.id, 3);
                                updated_metadata = null;
                                blog.poll(function (err) {
                                    if (err) return done(err);
                                    setTimeout(function () {
                                        assert(!updated_metadata);
                                        done();
                                    }, 100);
                                });
                            }, 100);
                        });
                    });
                });
                blog.on('updated_metadata', function (metadata) {
                    updated_metadata = metadata;
                });
                blog.abort();
            });
        });

        it('should detect changes to terms', function (done) {
            getBlog('bar', {
                option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var updated_terms;
                blog.on('load', function (posts, metadata) {
                    assert.deepEqual(Object.keys(metadata.terms), [ '1', '2', '3',
                        '4', '5', '6', '7', '10' ]);
                    db.query(
                        'INSERT INTO wp_3_terms VALUES (100, "Foo", "foo", 0); ' +
                        'INSERT INTO wp_3_term_taxonomy VALUES (100, 100, "category", "", 6, 0) '
                    , function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
                            if (err) return done(err);
                            setTimeout(function () {
                                assert(updated_terms);
                                assert.deepEqual(Object.keys(updated_terms), [ '1', '2', '3',
                                    '4', '5', '6', '7', '10', '100' ]);
                                assert.equal(updated_terms['100'].name, 'Foo');
                                assert.equal(updated_terms['100'].slug, 'foo');
                                assert.equal(updated_terms['100'].parent.name, updated_terms['6'].name);
                                assert.equal(updated_terms['6'].children[0], updated_terms['100']);
                                assert.equal(metadata.terms['100'].name, 'Foo');
                                assert.equal(metadata.terms['100'].slug, 'foo');
                                assert.equal(metadata.terms['100'].parent.name, metadata.terms['6'].name);
                                assert.equal(metadata.terms['6'].children[0], metadata.terms['100']);
                                done();
                            }, 100);
                        });
                    });
                });
                blog.on('updated_terms', function (terms) {
                    updated_terms = terms;
                });
                blog.abort();
            });
        });

        it('should pick up modifications to post terms', function (done) {
            var hours = new Date().getTimezoneOffset() / 60;
            getBlog('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                var updated_post = null;
                blog.on('load', function (posts) {
                    assert.equal(posts.length, 3);
                    var post = posts[2];
                    assert.equal(post.id, '3');
                    assert.deepEqual(post.categories.map(function (cat) {
                        return cat.name;
                    }), [ 'Advertorial', 'Travel' ]);
                    db.query(
                        'UPDATE wp_3_posts ' +
                        'SET post_modified_gmt = DATE_SUB(NOW(), ' +
                        '    INTERVAL ' + hours + ' HOUR) ' +
                        'WHERE ID = 3; ' +
                        'INSERT INTO wp_3_term_relationships VALUES (3,6,0) '
                    , function (err) {
                        if (err) return done(err);
                        blog.poll(function (err) {
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
                blog.on('updated_post', function (post) {
                    updated_post = post;
                });
                blog.abort();
            });
        });

        it('should provide a way to load a single post', function (done) {
            getBlog('foo', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, blog) {
                if (err) return done(err);
                blog.abort();
                blog.loadPost(1, function (err, post) {
                    if (err) return done(err);
                    assert.equal(post.id, '1');
                    assert.equal(post.title, 'Bacon ipsum');
                    assert.equal(post.orientation, 'top');
                    assert(Array.isArray(post.tags));
                    assert(Array.isArray(post.categories));
                    assert.equal(post.tags.length, 1);
                    assert.equal(post.categories.length, 2);
                    assert.equal(post.tags[0].name, 'Radical');
                    assert.equal(post.categories[1].name, 'Shopping');
                    assert(Array.isArray(post.categories[1].children));
                    assert.equal(post.categories[1].children.length, 1);
                    assert.equal(post.blog.pinterest, 'bacon');
                    done();
                });
                blog.on('error', done);
                blog.abort();
            });
        });

        it('should load the thumbnail crop', function (done) {
            getBlog('foo', function (err, blog) {
                if (err) return done(err);
                blog.loadPost(3, function (err, post) {
                    if (err) return done(err);
                    assert.equal(post.thumbnail_crop, 'foobar');
                    done();
                });
            });
        });

    });

    describe('Post', function () {

        it('should use the first image in the post as a featured image if not specified', function () {
            var post = Object.create(wordpress.Post.prototype);
            post._content = 'Foo bar <img src="foo.jpg"><img src="bar.jpg">';
            assert.equal(post.image, 'foo.jpg');
            assert(post.fallback_image);
            assert.equal(post.image, 'foo.jpg');
            post = Object.create(wordpress.Post.prototype);
            post._content = 'Foo bar';
            assert.equal(post.image, null);
            assert(post.fallback_image);
        });

    });

    describe('Category', function () {

        it('should match category slugs against a category and its parents', function () {
            var category = new wordpress.Category(0, 'Foo', 'foo')
              , subcategory = new wordpress.Category(1, 'Bar', 'bar', category)
              , subsubcategory = new wordpress.Category(2, 'Baz', 'baz', subcategory);
            assert(category.match('foo'));
            assert(!category.match('bar'));
            assert(subcategory.match('foo'));
            assert(subsubcategory.match('baz'));
            assert(subsubcategory.match('bar'));
            assert(subsubcategory.match('foo'));
            assert(!subsubcategory.match('foobar'));
        });

        it('should sync terms', function () {
            var foo = new wordpress.Category('1', 'Foo', 'foo')
              , bar = new wordpress.Category('2', 'Bar', 'bar', foo)
              , baz = new wordpress.Category('3', 'Baz', 'baz', null, [ foo ])
              , qux = new wordpress.Category('4', 'Qux', 'qux');
            var terms = {
                '1': foo
              , '2': bar
              , '4': qux
            };
            var metadata = new wordpress.Metadata(null, terms);
            assert.deepEqual(metadata.terms, terms);
            assert.deepEqual(Object.keys(metadata.category_slugs), [ 'foo', 'bar', 'qux' ]);
            assert(metadata.syncTerms({
                '1': { id: '1', name: 'ooF', slug: 'oof' }
              , '2': bar
              , '3': baz
            }));
            assert.deepEqual(Object.keys(metadata.terms), [ '1', '2', '3' ]);
            assert.deepEqual(Object.keys(metadata.category_slugs), [ 'bar', 'oof', 'baz' ]);
            assert.equal(metadata.categories.length, 3);
            assert.equal(metadata.terms['1'].name, 'ooF');
            assert.equal(metadata.terms['1'].slug, 'oof');
            assert.equal(metadata.terms['2'].parent.name, 'ooF');
            assert.equal(metadata.terms['2'].parent.slug, 'oof');
            assert.equal(metadata.terms['3'].children[0].name, 'ooF');
            assert.equal(metadata.terms['3'].children[0].slug, 'oof');
            assert.equal(foo.name, 'ooF');
            assert.equal(foo.slug, 'oof');
            assert(!metadata.syncTerms({
                '1': { id: '1', name: 'ooF', slug: 'oof' }
              , '2': bar
              , '3': baz
            }));
            assert.equal(metadata.categories.length, 3);
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': { id: '3', name: 'Baz', slug: 'baz', children: [ bar ]  }
            }));
            assert.equal(metadata.terms['3'].children[0].name, 'Bar');
            assert.equal(metadata.terms['3'].children[0].slug, 'bar');
            assert.equal(baz.children[0].name, 'Bar');
            assert.equal(baz.children[0].slug, 'bar');
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': { id: '3', name: 'Baz', slug: 'baz' }
            }));
            assert(!metadata.terms['3'].children);
            qux.parent = { id: '2' };
            qux.children = [ { id: '1' } ];
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': baz
              , '4': qux
            }));
            assert.equal(metadata.categories.length, 4);
            assert.equal(metadata.terms['4'].children[0].name, 'ooF');
            assert.equal(metadata.terms['4'].children[0].slug, 'oof');
            assert.equal(metadata.terms['4'].parent.name, 'Bar');
            assert.equal(metadata.terms['4'].parent.slug, 'bar');
            assert.equal(qux.children[0].name, 'ooF');
            assert.equal(qux.children[0].slug, 'oof');
            assert.equal(qux.parent.name, 'Bar');
            assert.equal(qux.parent.slug, 'bar');
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': baz
              , '4': { id: '4', name: 'Qux', slug: 'qux', parent: { id: '3' } }
            }));
            assert.equal(qux.parent.name, 'Baz');
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': baz
              , '4': { id: '4', name: 'Qux', slug: 'qux' }
            }));
            assert(!qux.parent);
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': baz
              , '4': { id: '4', name: 'Qux', slug: 'qux', parent: { id: '1' } }
            }));
            assert.equal(qux.parent.name, 'ooF');
            assert.equal(metadata.categories.length, 4);
            assert(metadata.syncTerms({
                '1': foo
              , '2': bar
              , '3': baz
              , '4': qux
              , '5': new wordpress.Tag('5', 'Yep', 'yep')
            }));
            assert.equal(metadata.categories.length, 4);
            assert.equal(metadata.tags.length, 1);
            assert(metadata.syncTerms({}));
            assert.equal(metadata.categories.length, 0);
            assert.equal(metadata.tags.length, 0);
            assert.equal(Object.keys(metadata.category_slugs).length, 0);
        });

    });

    describe('Archive', function () {

        it('should generate an archive index for a blog on load', function (done) {
            getLoader('bar', {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            }, function (err, foo) {
                if (err) return done(err);
                foo.load(function (err, posts, metadata) {
                    assert.deepEqual(metadata.archive, [
                        { year: 2012, months: [
                            { month: '11', count: 1 }, { month: '02', count: 1 }
                        ] }
                      , { year: 2011, months: [ { month: '07', count: 1 } ] }
                    ]);
                    done();
                });
            });
        });

        it('should sync an archive', function () {
            var posts = [
                { date: new Date('2011-10-10') }
              , { date: new Date('2011-10-12') }
              , { date: new Date('2011-12-12') }
              , { date: new Date('2013-05-12') }
                //Invalid dates are skipped:
              , { date: new Date('invalid') }
              , { date: new Date(0) }
            ];
            var metadata = new wordpress.Metadata();
            metadata.generateArchive(posts);
            var expected = [
                { year: 2013, months: [ { month: '05', count: 1 } ] }
              , { year: 2011, months: [ { month: '12', count: 1 }, { month: '10', count: 2 } ] }
            ];
            assert.deepEqual(metadata.archive, expected);

            //Test adding and removing posts with invalid dates
            assert(!metadata.addArchivePost({ date: new Date(0) }));
            assert(!metadata.addArchivePost({ date: new Date('invalid') }));
            assert.deepEqual(metadata.archive, expected);
            assert(!metadata.removeArchivePost({ date: new Date(0) }));
            assert(!metadata.removeArchivePost({ date: new Date('invalid') }));
            assert.deepEqual(metadata.archive, expected);

            //Test removing posts that aren't in sync with the archive
            assert(!metadata.removeArchivePost({ date: new Date('2011-11-05') }));
            assert(!metadata.removeArchivePost({ date: new Date('2012-09-05') }));
            assert(!metadata.removeArchivePost({ date: new Date('2009-09-05') }));
            assert.deepEqual(metadata.archive, expected);

            //Test removing a post where the count is decremented
            assert(!metadata.removeArchivePost({ date: new Date('2011-10-05') }));
            expected[1].months[1].count = 1;
            assert.deepEqual(metadata.archive, expected);

            //Test removing a post where the year/month has to be removed
            assert(metadata.removeArchivePost({ date: new Date('2011-10-05') }));
            var removed = expected[1].months.splice(1, 1);
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where the year/month has to be added
            assert(metadata.addArchivePost({ date: new Date('2011-10-05') }));
            expected[1].months.push(removed.shift());
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where the count is incremented
            assert(!metadata.addArchivePost({ date: new Date('2011-10-05') }));
            expected[1].months[1].count = 2;
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a year/month is to be inserted in the middle
            assert(metadata.addArchivePost({ date: new Date('2012-10-05') }));
            expected.splice(1, 0, { year: 2012, months: [ { month: '10', count: 1 } ] });
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a year/month is to be inserted at the end
            assert(metadata.addArchivePost({ date: new Date('2009-10-05') }));
            expected.push({ year: 2009, months: [ { month: '10', count: 1 } ] });
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a year/month is to be inserted at the start
            assert(metadata.addArchivePost({ date: new Date('2014-10-05') }));
            expected.splice(0, 0, { year: 2014, months: [ { month: '10', count: 1 } ] });
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a month has to be added at the end
            assert(metadata.addArchivePost({ date: new Date('2014-05-05') }));
            expected[0].months.push({ month: '05', count: 1 });
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a month has to be added at the start
            assert(metadata.addArchivePost({ date: new Date('2014-12-05') }));
            expected[0].months.unshift({ month: '12', count: 1 });
            assert.deepEqual(metadata.archive, expected);

            //Test adding a post where a month has to be added in the middle
            assert(metadata.addArchivePost({ date: new Date('2014-07-05') }));
            expected[0].months.splice(2, 0, { month: '07', count: 1 });
            assert.deepEqual(metadata.archive, expected);
        });

    });

});

