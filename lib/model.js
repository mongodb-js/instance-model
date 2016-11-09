const _ = require('lodash');
const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-rest-collection');
const AmpersandState = require('ampersand-state');
const DatabaseCollection = require('mongodb-database-model').Collection;
const CollectionCollection = require('mongodb-collection-model').Collection;
const hostname = require('os').hostname();

const HostInfo = AmpersandState.extend({
  props: {
    system_time: 'date',
    hostname: 'string',
    os: 'string',
    os_family: 'string',
    kernel_version: 'string',
    kernel_version_string: 'string',
    memory_bits: 'number',
    memory_page_size: 'number',
    arch: 'string',
    cpu_cores: 'number',
    cpu_cores_physical: 'number',
    cpu_scheduler: 'string',
    cpu_frequency: 'number',
    cpu_string: 'string',
    cpu_bits: 'number',
    machine_model: 'string',
    feature_numa: 'boolean',
    feature_always_full_sync: 'number',
    feature_nfs_async: 'number'
  }
});

const BuildInfo = AmpersandState.extend({
  props: {
    version: 'string',
    commit: 'string',
    commit_url: 'string',
    flags_loader: 'string',
    flags_compiler: 'string',
    allocator: 'string',
    javascript_engine: 'string',
    debug: 'boolean',
    for_bits: 'number',
    max_bson_object_size: 'number',
    enterprise_module: 'boolean'
  }
});

const Instance = AmpersandModel.extend({
  modelType: 'Instance',
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string'
    },
    /**
     * @todo (imlucas) Stabilize and cleanup
     * `replicaset`, `state`, and `aliases`.
     *
     * See: http://npm.im/mongodb-replicaset
     */
    replicaset: 'string',
    state: 'string',
    aliases: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  derived: {
    hostname: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return this._id.split(':')[0];
      }
    },
    port: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return parseInt(this._id.split(':')[1], 10);
      }
    }
  },
  collections: {
    databases: DatabaseCollection,
    collections: CollectionCollection
  },
  children: {
    host: HostInfo,
    build: BuildInfo
  },
  /**
   * Override `AmpersandModel.serialize()` to
   * make logging less chatty and problems easier
   * to debug.
   *
   * @return {Object}
   */
  serialize: function() {
    const res = this.getAttributes({
      props: true,
      derived: true
    }, true);

    if (this.databases.length > 0) {
      _.each(this._children, (value, key) => {
        res[key] = this[key].serialize();
      });
      _.each(this._collections, (value, key) => {
        res[key] = this[key].serialize();
      });
    }
    return res;
  }
});

const InstanceCollection = AmpersandCollection.extend({
  comparator: '_id',
  model: Instance,
  modelType: 'InstanceCollection'
});

module.exports = Instance;
module.exports.Collection = InstanceCollection;
module.exports.BuildInfo = BuildInfo;
module.exports.HostInfo = HostInfo;

module.exports.getId = function(id) {
  if (typeof id === 'number') {
    id = 'localhost:' + id;
  }
  return id.toLowerCase()
    .replace(hostname.toLowerCase(), 'localhost')
    .replace('127.0.0.1', 'localhost')
    .replace('mongodb://', '')
    .replace(/^[^@]+@/, '')
    .replace(/\/?\?(?:\w+=[^&]+&)*\w+=[^&]+$/, '');
};
