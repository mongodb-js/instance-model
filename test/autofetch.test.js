var _ = require('lodash');
var assert = require('assert');
var Connection = require('mongodb-connection-model');
var format = require('util').format;
var debug = require('debug')('mongodb-instance-model:test:autofetch');

var autofetch = require('../autofetch');


var fixtures = require('mongodb-connection-fixture').MATRIX.map(function(model) {
  return new Connection(model);
});

describe('mongodb-instance-model#autofetch', function() {
  describe('local', function() {
    var connection;
    before(require('mongodb-runner/mocha/before')());

    it('should connect to `localhost`', function() {
      connection = Connection.from('mongodb://localhost:27017');
      // connection = Connection.from('john:doe@localhost:30000/admin?authMechanism=MONGODB-CR');
      // connection = Connection.from('user:password@localhost:30000/admin?authMechanism=MONGODB-CR');
      assert.ok(connection);
    });

    // it('should list collections', function(done) {
    //   assert(connection);
    //   autofetch.getAllCollections(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('list collections', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });

    // it('should list databases', function(done) {
    //   assert(db);
    //   fetch.getDatabases(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('list databases', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });

    // it('should get build info', function(done) {
    //   assert(db);
    //   fetch.getBuildInfo(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('build info', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });

    // it('should get host info', function(done) {
    //   assert(db);
    //   fetch.getHostInfo(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('host info', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });

    it('should get instance details', function(done) {
      assert(connection);
      autofetch(connection, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });

    it('should get instance details for john doe', function(done) {
      connection = Connection.from('john:doe@localhost:30000/admin?authMechanism=MONGODB-CR');
      autofetch(connection, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
  });

  describe('remote', function() {
    var connection;

    it('should work with Kerberos', function(done) {
      this.slow(5000);
      this.timeout(70000);

      connection = Connection.from('mongodb://drivers%40LDAPTEST.10GEN.CC@ldaptest.10gen.cc:27017/kerberos?authMechanism=GSSAPI');
      debug('connection is', connection.serialize());
      autofetch(connection, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });

    it('should work on integrations@3.0 Cluster: Router 1', function(done) {
      this.slow(5000);
      this.timeout(30000);

      connection = Connection.from('integrations:7Jp23+MPkA@replset-0.compass-test-1.mongodb.parts:28017/admin?authMechanism=MONGODB-CR');
      autofetch(connection, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
  });

  if (fixtures.length > 0) {
    describe('functional #slow', function() {
      _.map(_.groupBy(fixtures, 'authentication'), function(connections, authentication) {
        describe(format('Using authentication `%s`', authentication), function() {
          _.each(connections, function(connection) {
            describe(connection.name, function() {
              // var db;
              // it('should connect', function(done) {
              //   if (process.env.dry) {
              //     this.skip();
              //     return;
              //   }
              //   this.slow(5000);
              //   this.timeout(20000);
              //
              //   connect(connection, function(err, _db) {
              //     if (err) {
              //       return done(err);
              //     }
              //     db = _db;
              //     done();
              //   });
              // });

              // it('should list databases', function(done) {
              //   if (process.env.dry ) {
              //     this.skip();
              //     return;
              //   }
              //   this.slow(5000);
              //   this.timeout(10000);
              //   assert(db, 'requires successful connection');
              //
              //   fetch.getDatabases(db, function(err, res) {
              //     if (err) return done(err);
              //
              //     assert(Array.isArray(res));
              //     assert(res.length > 0, 'Database list is empty');
              //     done();
              //   });
              // });
              //
              // it('should list collections', function(done) {
              //   if (process.env.dry ) {
              //     this.skip();
              //     return;
              //   }
              //   this.slow(5000);
              //   this.timeout(10000);
              //   assert(db, 'requires successful connection');
              //
              //   fetch.getAllCollections(db, function(err, res) {
              //     if (err) return done(err);
              //
              //     assert(Array.isArray(res));
              //     assert(res.length > 0, 'Collection list is empty');
              //     done();
              //   });
              // });


              it('should get instance details', function(done) {
                if (process.env.dry) {
                  this.skip();
                  return;
                }
                this.slow(5000);
                this.timeout(20000);
                autofetch(connection, function(err, res) {
                  debug('got instance details', res);
                  done(err, res);
                });
              });
            });
          });
        });
      });
    });
  }
});
