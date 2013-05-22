var assert = require('assert')
  , MySQL = require('../lib/mysql').MySQL;

describe('MySQL', function () {

    it('should format a mysql date', function () {
        var db = new MySQL()
          , date = new Date('2013-05-05 16:13:25')
          , utc_date = new Date(date.getTime() - new Date().getTimezoneOffset() * 60 * 1000);
        assert.equal(db.date(utc_date), '2013-05-05 16:13:25');
    });

});

