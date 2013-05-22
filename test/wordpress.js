var assert = require('assert')
  , wordpress = require('../lib/wordpress')
  , inherits = require('util').inherits
  , fs = require('fs');

var config = require('../test_config.js')
  , db = new wordpress.MySQL(config)
  , cache = {};

function getBlog(name, callback) {
    if (name in cache) {
        return callback(null, cache[name]);
    }
    var multisite = new wordpress.Multisite(db);
    multisite.getBlogs(function (err, blogs) {
        if (err) return callback(err);
        for (var i = 0; i < blogs.length; i++) {
            if (blogs[i].name === name) {
                cache[name] = blogs[i];
                return callback(null, blogs[i]);
            }
        }
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
                    assert.equal(category.parent, null);
                    assert(Array.isArray(category.children));
                    assert.equal(category.children[0], subcategory);
                    assert.equal(subcategory.name, 'Subcategory');
                    assert.equal(subcategory.parent, category);
                    assert(Array.isArray(subcategory.children));
                    assert.equal(subcategory.children[0], subsubcategory);
                    assert.equal(subsubcategory.name, 'Subsubcategory');
                    assert.equal(subsubcategory.parent, subcategory);
                    assert.equal(subsubcategory.children, null);
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
            var multisite = new wordpress.Multisite(db, { Post: MyPost });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                blogs[0].loadPosts(function (err, posts) {
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
            var multisite = new wordpress.Multisite(db, {
                Tag: MyTag
              , Category: MyCategory
            });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                blogs[0].loadTerms(function (err, terms) {
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
            var multisite = new wordpress.Multisite(db, {
                postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                var foo = blogs[0];
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
            var multisite = new wordpress.Multisite(db, {
                live: true
              , postmeta_keys: [ 'orientation' ]
              , option_keys: [ 'pinterest' ]
            });
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                var foo = blogs[0];
                var watcher = new wordpress.Watcher(foo);
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

        it('should pick up new posts');

        it('should pick up updated posts');

        it('should remove posts that are drafted or trashed after publishing');

        it('should pick up scheduled posts before initial load that are later published');

        it('should pick up scheduled posts after initial load that are later published');

        it('should detect changes to blog metadata');

        it('should detect changes to terms');

        it('should detect post => term relationship changes');

        it('should propagate term changes across post objects');

    });

});

