var MongoDBInstance = require('./model');
var MongoDBCollection = require('mongodb-collection-model').ExtendedCollectionModel;
var MongoDBCollectionCollection = require('mongodb-collection-model').Collection;
var BaseDatabaseModel = require('mongodb-database-model');
var BaseDatabaseCollection = require('mongodb-database-model').Collection;
var clientMixin = require('mongodb-collection-model').ScopeClientMixin;
var filterableMixin = require('ampersand-collection-filterable');
var selectableMixin = require('./selectable-collection-mixin');
var toNS = require('mongodb-ns');

/**
 * A user selectable collection of `MongoDBCollection`'s with `specialish`
 * collections filtered out.
 */
var MongoDBCollectionOnInstanceCollection = MongoDBCollectionCollection.extend({
  namespace: 'MongoDBCollectionOnInstanceCollection',
  model: MongoDBCollection,
  parse: function(res) {
    return res.filter(function(d) {
      return !toNS(d._id).system;
    });
  }
}, filterableMixin, selectableMixin);

var DatabaseModel = BaseDatabaseModel.extend({
  collections: {
    collections: MongoDBCollectionOnInstanceCollection
  }
});

var DatabaseCollection = BaseDatabaseCollection.extend({
  model: DatabaseModel
}, filterableMixin);

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 *
 * @see http://npm.im/mongodb-instance-model
 */
module.exports = MongoDBInstance.extend(clientMixin, {
  namespace: 'MongoDBInstance',
  collections: {
    databases: DatabaseCollection,
    collections: MongoDBCollectionOnInstanceCollection
  },
  url: '/instance'
});
