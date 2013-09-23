var assert = require('assert')
  , Connection = require('../lib/connection').Connection;

describe('Connection', function () {

    it('should format a date for mysql', function () {
        var db = new Connection()
          , date = new Date('2013-05-05 16:13:25');
        assert.equal(db.date(date), '2013-05-05 16:13:25');
    });

});

