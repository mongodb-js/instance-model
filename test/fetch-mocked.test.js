const assert = require('assert');
const fetch = require('../').fetch;
const fixtures = require('./fixtures');

describe('fetch-mocked', () => {
  let makeMockDB;

  before(() => {
    /**
     * Create a mock db object that will return an error or a result on
     * any of its methods. Pass in either and error or a result, but not
     * both (just like regular Errbacks).
     *
     * @param  {Error|null} err    if the call should return an error, specify
     *                             the error object here.
     * @param  {Any} res           if the call should return a value, specify
     *                             the value here.
     * @return {Object}            a db object that behaves like the mongodb
     *                             driver
     */
    makeMockDB = (err, res) => {
      const db = {};
      db.admin = () => {
        return {
          // all other commands return the global err/res results
          command: (command, options, callback) => { callback(err, res); },
          databaseName: 'admin',
          // listCollections is a separate function on the admin object
          listCollections: () => {
            return {
              toArray: (callback) => { callback(err, res); }
            };
          }
        };
      };
      db.db = (databaseName) => {
        if (databaseName === 'admin') {
          return db.admin();
        }
        return {
          databaseName: databaseName,
          listCollections: () => {
            return {
              toArray: (callback) => { callback(err, res); }
            };
          }
        };
      };
      return db;
    };
  });

  describe('getBuildInfo', () => {
    it('should pass on any error that buildInfo returns', (done) => {
      // instead of the real db handle, pass in the mocked one
      const results = {
        // make a db that always returns error for db.admin().buildInfo()
        db: makeMockDB(new Error('some strange error'), null)
      };
      fetch.getBuildInfo((err, res) => {
        assert.equal(res, null);
        assert.equal(err.command, 'buildInfo');
        assert.equal(err.message, 'some strange error');
        done();
      }, results);
    });
    it('should detect enterprise module correctly for 2.6 and 3.0', (done) => {
      const results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_OLD)
      };
      fetch.getBuildInfo((err, res) => {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      }, results);
    });
    it('should detect enterprise module correctly for 3.2 +', (done) => {
      const results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_3_2)
      };
      fetch.getBuildInfo((err, res) => {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      }, results);
    });
  });

  describe('getHostInfo', () => {
    it('should ignore auth errors gracefully', (done) => {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(new Error('not authorized on fooBarDatabase to execute command '
          + '{listCollections: true, filter: {}, cursor: {}'), null)
      };
      fetch.getHostInfo((err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
    it('should pass on other errors from the hostInfo command', (done) => {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(new Error('some other error from hostInfo'), null)
      };
      fetch.getHostInfo((err, res) => {
        assert.ok(err);
        assert.equal(err.command, 'hostInfo');
        assert.deepEqual(res, null);
        done();
      }, results);
    });
  });

  describe('listDatabases', () => {
    const results = {};

    beforeEach(() => {
      results.userInfo = fixtures.USER_INFO_JOHN;
    });

    it('should ignore auth errors gracefully', (done) => {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(new Error('not authorized on admin to execute command '
        + '{ listDatabases: 1.0 }'), null);

      fetch.listDatabases((err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
    it('should pass on other errors from the listDatabases command', (done) => {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(new Error('some other error from hostInfo'), null);

      fetch.listDatabases((err, res) => {
        assert.ok(err);
        assert.equal(err.command, 'listDatabases');
        assert.deepEqual(res, null);
        done();
      }, results);
    });
  });

  describe('getAllowedDatabases', () => {
    const results = {};

    it('should return all databases for which the user can list collections', (done) => {
      results.userInfo = fixtures.USER_INFO_JOHN;

      fetch.getAllowedDatabases((err, res) => {
        assert.equal(err, null);
        res.sort();
        assert.deepEqual(res, ['accounts', 'products', 'reporting', 'sales']);
        done();
      }, results);
    });

    it('should return empty list for users with no list collections', (done) => {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      fetch.getAllowedDatabases((err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });

  describe('getAllowedCollections', () => {
    const results = {};

    it('should return all collections the user info says it can access', (done) => {
      results.userInfo = fixtures.USER_INFO_JOHN;

      fetch.getAllowedCollections((err, res) => {
        assert.equal(err, null);
        const expected = [
          {
            '_id': 'tenants.mongodb',
            'database': 'tenants',
            'name': 'mongodb',
            'readonly': false
          }
        ];
        assert.deepEqual(res, expected);
        done();
      }, results);
    });

    it('should return empty list for users with no collections', (done) => {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      fetch.getAllowedCollections((err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });

  describe('getDatabaseCollections', () => {
    const results = {};
    it('should ignore auth errors gracefully', (done) => {
      results.db = makeMockDB(new Error('not authorized on fooBarDatabase to execute command '
        + '{listCollections: true, filter: {}, cursor: {}'), null);

      fetch.getDatabaseCollections(results.db.admin(), (err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });

    it('should pass on other errors from the listCollections command', (done) => {
      results.db = makeMockDB(new Error('some other error from list collections'), null);

      fetch.getDatabaseCollections(results.db.admin(), (err, res) => {
        assert.ok(err);
        assert.equal(err.command, 'listCollections');
        assert.deepEqual(res, null);
        done();
      });
    });
  });

  describe('listCollections', () => {
    const results = {};

    beforeEach(() => {
      results.databases = [
        {
          'name': 'accounts'
        },
        {
          'name': 'products'
        },
        {
          'name': 'reporting'
        },
        {
          'name': 'sales'
        }
      ];
    });

    it('should lists all collections for each listable db', (done) => {
      results.userInfo = fixtures.USER_INFO_JOHN;
      results.db = makeMockDB(null, [{
        'name': 'testCol',
        'info': {
          'readOnly': true
        }
      }]);

      fetch.listCollections((err, res) => {
        assert.equal(err, null);
        res.sort();
        const expected = [
          {
            '_id': 'accounts.testCol',
            'database': 'accounts',
            'name': 'testCol',
            'readonly': true
          },
          {
            '_id': 'products.testCol',
            'database': 'products',
            'name': 'testCol',
            'readonly': true
          },
          {
            '_id': 'reporting.testCol',
            'database': 'reporting',
            'name': 'testCol',
            'readonly': true
          },
          {
            '_id': 'sales.testCol',
            'database': 'sales',
            'name': 'testCol',
            'readonly': true
          }
        ];
        expected.sort();
        assert.deepEqual(res, expected);
        done();
      }, results);
    });

    it('should be empty for no privileges', (done) => {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;
      results.db = makeMockDB(null, []);

      fetch.listCollections((err, res) => {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });
});
