const Model = require('./lib/model');
const fetch = require('./lib/fetch');
const _ = require('lodash');
const URL = require('mongodb-url');
const debug = require('debug')('mongodb-instance-model');

module.exports = Model;
module.exports.fetch = fetch;
module.exports.get = function(db, done) {
  fetch(db, function(err, res) {
    if (err) {
      return done(err);
    }

    let port;
    let hostname;

    if (_.has(db, 's.options.url')) {
      debug('parsing port and hostname from driver url option `%s`',
        db.s.options.url);
      port = URL.port(db.s.options.url);
      hostname = URL.hostname(db.s.options.url);
    }

    if (_.has(res, 'host.hostname')) {
      /**
       * Use the hostname from fetch#getBuildInfo()
       * as authoratative.
       *
       * NOTE (imlucas) In the real world, `db.s.options.url`
       * gives a gauarantee that the hostname is routable
       * from the users perspective.  The hostname returned by
       * fetch#getBuildInfo() may not (e.g. AWS' internal DNS for EC2).
       */
      hostname = URL.hostname(res.host.hostname);
      if (/\:\d+/.test(res.host.hostname)) {
        port = URL.port(res.host.hostname);
      }
    }

    res._id = [hostname, port].join(':');
    debug('instance.get returning %j', res);
    done(null, res);
  });
};
