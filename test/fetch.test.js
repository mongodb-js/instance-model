const _ = require('lodash');
const assert = require('assert');
const Connection = require('mongodb-connection-model');
const connect = Connection.connect;
const format = require('util').format;
const fetch = require('../').fetch;
const runner = require('mongodb-runner');
const debug = require('debug')('mongodb-instance-model:test:fetch');

const fixtures = require('mongodb-connection-fixture').MATRIX.map((model) => {
  return new Connection(model);
});

describe('mongodb-instance-model#fetch', () => {
  describe('local', () => {
    let db;
    before(function(done) {
      this.timeout(20000);
      runner.start({}, done);
    });
    after(function() {
      if (db) {
        db.close();
      }
    });
    it('should connect to `localhost:27017`', (done) => {
      const model = Connection.from('mongodb://localhost:27017');
      connect(model, function(err, _db) {
        if (err) {
          return done(err);
        }
        db = _db;
        done();
      });
    });
    it('should get instance details', (done) => {
      assert(db);
      fetch(db, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
    it('should not close the db after getting instance details', (done) => {
      assert(db);
      fetch(db, function(err) {
        if (err) {
          return done(err);
        }
        db.admin().ping(function(_err, pingResult) {
          if (_err) {
            done(_err);
          }
          done(null, pingResult);
        });
      });
    });
  });

  /**
   * @todo (imlucas) After mongodb-tools rewrite, http://npm.im/mongodb-runner
   * will be able to properly spin up deployments w authentication.
   */
  it.skip('should get instance details for john doe', (done) => {
    const connection = Connection.from('john:doe@localhost:30000/admin?authMechanism=MONGODB-CR');
    connect(connection, function(err, db) {
      if (err) {
        return done(err);
      }
      fetch(db, function(_err, res) {
        if (_err) {
          return done(_err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
  });

  if (fixtures.length > 0) {
    describe('functional #slow', () => {
      _.map(_.groupBy(fixtures, 'authentication'), function(models, authentication) {
        describe(format('Using authentication `%s`', authentication), () => {
          _.each(models, function(model) {
            describe(model.name, () => {
              let db;
              it('should connect', (done) => {
                if (process.env.dry) {
                  this.skip();
                  return;
                }
                this.slow(5000);
                this.timeout(20000);

                connect(model, function(err, _db) {
                  if (err) {
                    return done(err);
                  }
                  db = _db;
                  done();
                });
              });
              it('should get instance details', (done) => {
                if (process.env.dry) {
                  this.skip();
                  return;
                }

                this.slow(5000);
                this.timeout(10000);
                assert(db, 'requires successful connection');
                fetch(db, function(err, res) {
                  debug('got instance details', res);
                  done(err, res);
                });
              });

              after(function() {
                if (db) {
                  db.close();
                }
              });
            });
          });
        });
      });
    });
  }
});
