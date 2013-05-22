var assert = require('assert')
  , utils = require('../lib/wordpress');

/*jshint -W015 */

describe('Utilities', function () {

    it('should create multiline strings', function () {
        var str = utils.multiline(function () {/*
            SELECT * FROM foo
        */});
        assert.equal(str, 'SELECT * FROM foo');
        str = utils.multiline(function () {/*
            SELECT *
            FROM foo
        */});
        assert.equal(str, 'SELECT * FROM foo');
    });

    it('should fail on invalid multiline strings', function () {
        assert.throws(function () {
            utils.multiline(function () {
                /* SELECT * FROM foo */
            });
        });
    });

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

    it('should calculate object diffs', function () {
        var foo = { a: 'b', c: 'd' }
          , bar = { x: 'z', c: 'e' }
          , called = false;
        utils.diff(foo, bar, function (changed, added, deleted) {
            called = true;
            assert.deepEqual(added, [ 'x' ]);
            assert.deepEqual(changed, [ 'c' ]);
            assert.deepEqual(deleted, [ 'a' ]);
        });
        assert(called);
    });

});

