var assert = require('assert')
  , utils = require('../lib/utils');

/*jshint -W015 */

describe('lib/utils.js', function () {

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

});

