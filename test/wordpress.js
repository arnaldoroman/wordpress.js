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

var db_config = require('../test_config.js');
db_config.multiStatements = true;

var db = new wordpress.MySQL(db_config);

describe('Wordpress', function () {

    before(function (callback) {
        db.connect(function (err) {
            if (err) return callback(err);
            importFixtures(db, callback);
        });
    });

    it('should load all blogs on a multisite install', function (done) {
        var multisite = new wordpress.Multisite(db);
        multisite.getBlogs(function (err, blogs) {
            if (err) return done(err);
            assert(Array.isArray(blogs));
            assert.equal(blogs.length, 2);
            assert.equal(blogs[0].id, 2);
            assert.equal(blogs[0].name, 'foo');
            assert.equal(blogs[1].id, 3);
            assert.equal(blogs[1].name, 'bar');
            done();
        });
    });

});
