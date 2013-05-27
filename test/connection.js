var assert = require('assert')
  , Connection = require('../lib/connection').Connection;

describe('Connection', function () {

    it('should format a date for mysql', function () {
        var db = new Connection()
          , date = new Date('2013-05-05 16:13:25')
          , utc_date = new Date(date.getTime() - new Date().getTimezoneOffset() * 60 * 1000);
        assert.equal(db.date(utc_date), '2013-05-05 16:13:25');
    });

});

