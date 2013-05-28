var lib_dir = process.env.JS_COV ? '../lib-cov/': '../lib/';

var assert = require('assert')
  , utils = require(lib_dir + 'wordpress');

describe('Utilities', function () {

    it('should copy objects', function () {
        var original = { a: 'b' };
        var copy = utils.copy(original, { 'c': 'd' });
        assert(copy.c, 'd');
        assert(!('c' in original));
    });

    it('should create an excerpt which cleanly truncates words', function () {
        assert.equal(utils.excerpt('foo bar baz', 11), 'foo bar baz');
        assert.equal(utils.excerpt('foo bar baza', 11), 'foo bar...');
    });

    it('should strip tags from excerpts', function () {
        assert.equal(utils.excerpt('foo <a href="#">bar</a> <b>baz</b>', 11), 'foo bar baz');
        assert.equal(utils.excerpt('<p>foo bar baza</p>', 11), 'foo bar...');
    });

    it('should strip bbtags from excerpts', function () {
        assert.equal(utils.excerpt('foo [caption bla]<img src="foo.jpg">[/caption] bar', 11), 'foo bar');
    });

    it('should execute functions in parallel', function (done) {
        utils.parallel([], function (err) {
            if (err) return done(err);
            utils.parallel([
                function (callback) {
                    callback('foo');
                }
              , function (callback) {
                    callback('bar');
                }
            ], function (err) {
                assert(err);
                done();
            });
        });
    });

    it('should provide a safe setInterval wrapper', function (done) {
        var calls = 1;
        utils.setInterval(function (next) {
            if (!--calls) {
                done();
            }
            next();
            next(); //Ignored
        }, 10);
    });

    it('should provide a way for the setInterval function to be invoked immediately', function (done) {
        var test = '';
        utils.setInterval(function (next) {
            test += 'foo';
        }, 1000, true);
        test += 'bar';
        assert.equal(test, 'foobar');
        test = '';
        utils.setInterval(function (next) {
            test += 'foo';
        }, 10);
        test += 'bar';
        setTimeout(function () {
            assert.equal(test, 'barfoo');
            done();
        }, 50);
    });

});

