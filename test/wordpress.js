var lib_dir = process.env.JS_COV ? '../lib-cov/': '../lib/';

var assert = require('assert')
  , wordpress = require(lib_dir + 'wordpress')
  , fs = require('fs');

var fixtures = null, cache = {};

function loadFixtures(callback) {
    if (fixtures !== null) {
        return callback(null, fixtures);
    }
    fs.readFile(__dirname + '/fixtures.sql', function (err, fixtures_) {
        if (err) return callback(err);
        fixtures = fixtures_.toString();
        callback(null, fixtures);
    });
}

function importFixtures(db, callback) {
    loadFixtures(function (err, fixtures) {
        if (err) return callback(err);
        db.query(fixtures, callback);
    });
}

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

var config = require('../test_config.js');

var db = new wordpress.MySQL(config);

describe('Wordpress', function () {

    before(function (callback) {
        db.connect(function (err) {
            if (err) return callback(err);
            importFixtures(db, function (err) {
                if (err) return callback(err);
                getBlog('foo', callback);
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
                    var post = posts[0];
                    assert.equal(post.id, '1');
                    assert.equal(post.name, 'bacon-ipsum');
                    assert.equal(post.title, 'Bacon ipsum');
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

    });

});

