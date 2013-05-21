var assert = require('assert')
  , wordpress = require('../lib/wordpress')
  , fs = require('fs')
  , zlib = require('zlib');

var fixtures = null;

function loadFixtures(callback) {
    if (fixtures !== null) {
        return callback(null, fixtures);
    }
    fs.readFile(__dirname + '/fixtures.sql.gz', function (err, gz) {
        if (err) return callback(err);
        zlib.gunzip(gz, function (err, queries) {
            if (err) return callback(err);
            fixtures = queries.toString();
            callback(null, fixtures);
        });
    });
}

function importFixtures(db, callback) {
    loadFixtures(function (err, fixtures) {
        if (err) return callback(err);
        db.query(fixtures, callback);
    });
}

var config = require('../test_config.js');

var db = new wordpress.MySQL(config);

describe('Wordpress', function () {

    before(function (callback) {
        db.connect(function (err) {
            if (err) return callback(err);
            importFixtures(db, callback);
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
            var multisite = new wordpress.Multisite(db);
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                var foo = blogs[0];
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
            var multisite = new wordpress.Multisite(db);
            multisite.getBlogs(function (err, blogs) {
                if (err) return done(err);
                var foo = blogs[0];
                foo.loadMetadata([ 'twitter' ], function (err, metadata) {
                    if (err) return done(err);
                    assert.equal(typeof metadata, 'object');
                    assert.equal(metadata.twitter, 'bacon');
                    assert.equal(Object.keys(metadata).length, 1);
                    done();
                });
            });
        });

    });

});

