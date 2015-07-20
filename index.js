'use strict';
var Structure = require('./src/structure');

/**
 * Creates a new instance of Immstruct, having it's own list
 * of Structure instances.
 *
 * ### Examples:
 * ```js
 * var ImmstructInstance = require('immstruct').Immstruct;
 * var immstruct = new ImmstructInstance();
 * var structure = immstruct.get({ data: });
 * ```
 *
 * @property {Array} instances Array of `Structure` instances.
 *
 * @class {Immstruct}
 * @constructor
 * @returns {Immstruct}
 * @api public
 */
function Immstruct () {
  if (!(this instanceof Immstruct)) {
    return new Immstruct();
  }

  this._instances = {};
}

/**
 *
 * Gets or creates a new instance of {Structure}. Provide optional
 * key to be able to retrieve it from list of instances. If no key
 * is provided, a random key will be generated.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct.get('myStruct', { foo: 'Hello' });
 * ```
 * @param {String} [key] - defaults to random string
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @returns {Structure}
 * @module immstruct.get
 * @api public
 */
Immstruct.prototype.get = function (key, data) {
  return getInstance(this, {
    key: key,
    data: data
  });
};

/**
 *
 * Get list of all instances created.
 *
 * @param {String} [name] - Name of the instance to get. If undefined get all instances
 *
 * @returns {Array}
 * @module immstruct.getInstances
 * @api public
 */
Immstruct.prototype.instance = function (name) {
  if (name) return this._instances[name];
  return this._instances;
};

/**
 * Clear the entire list of `Structure` instances from the Immstruct
 * instance. You would do this to start from scratch, freeing up memory.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * immstruct.clear();
 * ```
 * @module immstruct.clear
 * @api public
 */
Immstruct.prototype.clear = function () {
  this._instances = {};
};

/**
 * Remove one `Structure` instance from the Immstruct instances list.
 * Provided by key
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * immstruct('myKey', { foo: 'hello' });
 * immstruct.remove('myKey');
 * ```
 * @param {String} key
 *
 * @module immstruct.remove
 * @api public
 * @returns {Boolean}
 */
Immstruct.prototype.remove = function (key) {
  return delete this._instances[key];
};


/**
 * Gets or creates a new instance of `Structure` with history (undo/redo)
 * activated per default. Same usage and signature as regular `Immstruct.get`.

 * Provide optional key to be able to retrieve it from list of instances.
 * If no key is provided, a random key will be generated.
 *
 * Provide optional limit to cap the last number of history references
 * that will be kept. Once limit is reached, a new history record
 * shifts off the oldest record. The default if omitted is Infinity.
 * Setting to 0 is the as not having history enabled in the first place.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct.withHistory('myStruct', 10, { foo: 'Hello' });
 * var structure = immstruct.withHistory(10, { foo: 'Hello' });
 * var structure = immstruct.withHistory('myStruct', { foo: 'Hello' });
 * var structure = immstruct.withHistory({ foo: 'Hello' });
 * ```
 *
 * @param {String} [key] - defaults to random string
 * @param {Number} [limit] - defaults to Infinity
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @module immstruct.withHistory
 * @api public
 * @returns {Structure}
 */
Immstruct.prototype.withHistory = function (key, limit, data) {
  return getInstance(this, {
    key: key,
    data: data,
    history: true,
    historyLimit: limit
  });
};

var inst = new Immstruct();

/**
 * This is a default instance of `Immstruct` as well as a shortcut for
 * creating `Structure` instances (See `Immstruct.get` and `Immstruct`).
 * This is what is returned from `require('immstruct')`.
 *
 * From `Immstruct.get`:
 * Gets or creates a new instance of {Structure} in the default Immstruct
 * instance. A link to `immstruct.get()`. Provide optional
 * key to be able to retrieve it from list of instances. If no key
 * is provided, a random key will be generated.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct('myStruct', { foo: 'Hello' });
 * var structure2 = immstruct.withHistory({ bar: 'Bye' });
 * immstruct.remove('myStruct');
 * // ...
 * ```
 *
 * @param {String} [key] - defaults to random string
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @api public
 * @see {@link Immstruct}
 * @see {Immstruct.prototype.get}
 * @module immstruct
 * @class {Immstruct}
 * @returns {Structure|Function}
 */
module.exports = function (key, data) {
  return getInstance(inst, {
    key: key,
    data: data
  });
};

module.exports.withHistory = function (key, limit, data) {
  return getInstance(inst, {
    key: key,
    data: data,
    history: true,
    historyLimit: limit
  });
};

module.exports.Structure = Structure;
module.exports.Immstruct = Immstruct;
module.exports.clear     = inst.clear.bind(inst);
module.exports.remove    = inst.remove.bind(inst);
module.exports.get       = inst.get.bind(inst);
module.exports.instance = function (name) {
  if (name) return inst._instances[name];
  return inst._instances;
};

function getInstance (obj, options) {
  if (typeof options.key === 'object') {
    options.data = options.key;
    options.key = void 0;
  } else if (typeof options.key === 'number') {
    options.data = options.historyLimit;
    options.historyLimit = options.key;
    options.key = void 0;
  } else if (typeof options.historyLimit === 'object') {
    options.data = options.historyLimit;
    options.historyLimit = void 0;
  }

  if (options.key && obj._instances[options.key]) {
    return obj._instances[options.key];
  }

  var newInstance = new Structure(options);
  obj._instances[newInstance.key] = newInstance;
  return newInstance;
}
