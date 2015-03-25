'use strict';

var Immutable = require('immutable');
var Cursor = require('immutable/contrib/cursor');
var EventEmitter = require('eventemitter3').EventEmitter;
var inherits = require('inherits');
var utils = require('./utils');

 /**
 * Creates a new `Structure` instance. Also accessible through
 * `Immstruct.Structre`.
 *
 * ### Examples:
 *
 *     var Structure = require('immstruct/structure');
 *     var s = new Structure({ data: { foo: 'bar' }});
 *
 *     // Or:
 *     // var Structure = require('immstruct').Structure;
 *
 * ### Options
 *
 * ```
 * {
 *   key: String, // Defaults to random string
 *   data: Object|Immutable, // defaults to empty Map
 *   history: Boolean // Defaults to false
 * }
 * ```
 *
 * @property {Immutable.List} history `Immutable.List` with history.
 * @property {Object|Immutable} current Provided data as immutable data
 * @property {String} key Generated or provided key.
 *
 *
 * @param {{ key: String, data: Object, history: Boolean }} [options] - defaults to random key and empty data (immutable structure). No history
 *
 * @constructor
 * @class {Structure}
 * @returns {Structure}
 * @api public
 */
function Structure (options) {
  var self = this;

  options = options || {};
  if (!(this instanceof Structure)) {
    return new Structure(options);
  }

  this.key = options.key || utils.generateRandomKey();

  this.current = options.data;
  if (!isImmutableStructure(this.current) || !this.current) {
    this.current = Immutable.fromJS(this.current || {});
  }

  if (!!options.history) {
    this.history = Immutable.List.of(this.current);
    this._currentRevision = 0;
  }

  this._pathListeners = [];
  this.on('swap', function (newData, oldData, keyPath) {
    listListenerMatching(self._pathListeners, pathString(keyPath)).forEach(function (fns) {
      fns.forEach(function (fn) {
        if (typeof fn !== 'function') return;
        fn(newData, oldData, keyPath);
      });
    });
  });

  EventEmitter.call(this, arguments);
}
inherits(Structure, EventEmitter);
module.exports = Structure;


/**
 * Create a Immutable.js Cursor for a given `path` on the `current` structure (see `Structure.current`).
 * Changes made through created cursor will cause a `swap` event to happen (see `Events`).
 *
 * ### Examples:
 *
 *     var Structure = require('immstruct/structure');
 *     var s = new Structure({ data: { foo: 'bar', a: { b: 'foo' } }});
 *     s.cursor().set('foo', 'hello');
 *     s.cursor('foo').update(function () { return 'Changed'; });
 *     s.cursor(['a', 'b']).update(function () { return 'bar'; });
 *
 * See more examples in the [tests](https://github.com/omniscientjs/immstruct/blob/master/tests/structure_test.js)
 *
 * @param {String|Array} [path] - defaults to empty string. Can be array for path. See Immutable.js Cursors
 *
 * @api public
 * @module structure.cursor
 * @returns {Cursor} Gives a Cursor from Immutable.js
 */
Structure.prototype.cursor = function (path) {
  var self = this;
  path = path || [];

  if (!this.current) {
    throw new Error('No structure loaded.');
  }

  var changeListener = function (newRoot, oldRoot, path) {
    if(self.current === oldRoot) {
      self.current = newRoot;
    } else if(!hasIn(newRoot, path)) {
      // Othewise an out-of-sync change occured. We ignore `oldRoot`, and focus on
      // changes at path `path`, and sync this to `self.current`.
      self.current = self.current.removeIn(path);
    } else {
      // Update an existing path or add a new path within the current map.
      self.current = self.current.setIn(path, newRoot.getIn(path));
    }

    return self.current;
  };

  changeListener = handleHistory(this, changeListener);
  changeListener = handleSwap(this, changeListener);
  changeListener = handlePersisting(this, changeListener);
  return Cursor.from(self.current, path, changeListener);
};

/**
 * Creates a reference. A reference can be a pointer to a cursor, allowing
 * you to create cursors for a specific path any time. This is essentially
 * a way to have "always updated cursors" or Reference Cursors. See example
 * for better understanding the concept.
 *
 * References also allow you to listen for changes specific for a path.
 *
 * ### Examples:
 *
 *     var structure = immstruct({
 *       someBox: { message: 'Hello World!' }
 *     });
 *     var ref = structure.reference(['someBox']);
 *
 *     var unobserve = ref.observe(function () {
 *       // Called when data the path 'someBox' is changed.
 *       // Also called when the data at ['someBox', 'message'] is changed.
 *     });
 *
 *     // Update the data using the ref
 *     ref.cursor().update(function () { return 'updated'; });
 *
 *     // Update the data using the initial structure
 *     structure.cursor(['someBox', 'message']).update(function () { return 'updated again'; });
 *
 *     // Remove the listener
 *     unobserve();
 *
 * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
 *
 * @param {String|Array} [path] - defaults to empty string. Can be array for path. See Immutable.js Cursors
 *
 * @api public
 * @module structure.reference
 * @returns {Reference}
 * @constructor
 */
Structure.prototype.reference = function (path) {
  if (isCursor(path) && path._keyPath) {
    path = path._keyPath;
  }
  var self = this, pathId = pathString(path);
  var listenerNs = self._pathListeners[pathId];
  var cursor = this.cursor(path);

  var changeListener = function (newRoot, oldRoot, changedPath) { cursor = self.cursor(path); };
  var referenceListeners = [changeListener];
  this._pathListeners[pathId] = !listenerNs ? referenceListeners : listenerNs.concat(changeListener);

  return {
    /**
     * Observe for changes on a reference.
     *
     * ### Examples:
     *
     *     var ref = structure.reference(['someBox']);
     *
     *     var unobserve = ref.observe('delete', function () {
     *       // Called when data the path 'someBox' is removed from the structure.
     *     });
     *
     * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
     *
     * ### Event names
     * Event names can be either
     *
     *  * `add`: When new data/value is added
     *  * `delete`: When data/value is removed
     *  * `change`: When data/value is updated and it existed before
     *  * `swap`: When cursor is updated (new information is set). Emits no values. One use case for this is to re-render design components
     *
     * @param {String} [eventName] - Type of change
     * @param {Function} callback - Callback when referenced data is swapped
     *
     * @api public
     * @module reference.observe
     * @returns {Function} Function for removing observer (unobserve)
     */
    observe: function (eventName, newFn) {
      if (typeof eventName === 'function') {
        newFn = eventName;
        eventName = void 0;
      }
      if (this._dead || typeof newFn !== 'function') return;
      if (eventName && eventName !== 'swap') {
        newFn = onlyOnEvent(eventName, newFn);
      }

      self._pathListeners[pathId] = self._pathListeners[pathId].concat(newFn);
      referenceListeners = referenceListeners.concat(newFn);

      return function unobserve () {
        var fnIndex = self._pathListeners[pathId].indexOf(newFn);
        var localListenerIndex = referenceListeners.indexOf(newFn);

        if (referenceListeners[localListenerIndex] === newFn) {
          referenceListeners.splice(localListenerIndex, 1);
        }

        if (!self._pathListeners[pathId]) return;
        if (self._pathListeners[pathId][fnIndex] !== newFn) return;
        self._pathListeners[pathId].splice(fnIndex, 1);
      };
    },

    /**
     * Create a new, updated, cursor from the base path provded to the
     * reference. This returns a Immutable.js Cursor as the regular
     * cursor method. You can also provide a sub-path to create a reference
     * in a deeper level.
     *
     * ### Examples:
     *
     *     var ref = structure.reference(['someBox']);
     *     var cursor = ref.cursor('someSubPath');
     *     var cursor2 = ref.cursor();
     *
     * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
     *
     * @param {String} [subpath] - Subpath to a deeper structure
     *
     * @api public
     * @module reference.cursor
     * @returns {Cursor} Immutable.js cursor
     */
    cursor: function (subPath) {
      if (subPath) return cursor.cursor(subPath);
      return cursor;
    },

    /**
     * Remove all observers from reference.
     *
     * @api public
     * @module reference.unobserveAll
     * @returns {Void}
     */
    unobserveAll: function () {
      removeAllListenersBut(self, pathId, referenceListeners, changeListener);
      referenceListeners = [changeListener];
    },

    /**
     * Destroy reference. Unobserve all observers, set all endpoints of reference to dead.
     * For cleaning up memory.
     *
     * @api public
     * @module reference.destroy
     * @returns {Void}
     */
    destroy: function () {
      removeAllListenersBut(self, pathId, referenceListeners);
      referenceListeners = void 0;
      cursor = void 0;

      this._dead = true;
      this.observe = void 0;
      this.unobserveAll = void 0;
      this.cursor = void 0;
      this.destroy = void 0;
    }
  };
};

/**
 * Force emitting swap event. Pass on new, old and keypath passed to swap.
 * If newData is `null` current will be used.
 *
 * @param {Object} newData - Immutable object for the new data to emit
 * @param {Object} oldData - Immutable object for the old data to emit
 * @param {String} keyPath - Structure path (in tree) to where the changes occured.
 *
 * @api public
 * @module structure.forceHasSwapped
 * @returns {Void}
 */
Structure.prototype.forceHasSwapped = function (newData, oldData, keyPath) {
  this.emit('swap', newData || this.current, oldData, keyPath);
  possiblyEmitAnimationFrameEvent(this, newData || this.current, oldData, keyPath);
};


/**
 * Undo IFF history is activated and there are steps to undo. Returns new current
 * immutable structure.
 *
 * **Will NOT emit swap when redo. You have to do this yourself**.
 *
 * Define number of steps to undo in param.
 *
 * @param {Number} steps - Number of steps to undo
 *
 * @api public
 * @module structure.undo
 * @returns {Object} New Immutable structure after undo
 */
Structure.prototype.undo = function(steps) {
  this._currentRevision -= steps || 1;
  if (this._currentRevision < 0) {
    this._currentRevision = 0;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

/**
 * Redo IFF history is activated and you can redo. Returns new current immutable structure.
 * Define number of steps to redo in param.
 * **Will NOT emit swap when redo. You have to do this yourself**.
 *
 * @param {Number} head - Number of steps to head to in redo
 *
 * @api public
 * @module structure.redo
 * @returns {Object} New Immutable structure after redo
 */
Structure.prototype.redo = function(head) {
  this._currentRevision += head || 1;
  if (this._currentRevision > this.history.count() - 1) {
    this._currentRevision = this.history.count() - 1;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

/**
 * Undo IFF history is activated and passed `structure` exists in history.
 * Returns the same immutable structure as passed as argument.
 *
 * **Will NOT emit swap after undo. You have to do this yourself**.
 *
 * @param {Object} structure - Immutable structure to redo until
 *
 * @api public
 * @module structure.undoUntil
 * @returns {Object} New Immutable structure after undo
 */
Structure.prototype.undoUntil = function(structure) {
  this._currentRevision = this.history.indexOf(structure);
  this.current = structure;

  return structure;
};


// Private decorators.

// Update history if history is active
function handleHistory (emitter, fn) {
  return function (newData, oldData, path) {
    var newStructure = fn.apply(fn, arguments);
    if (!emitter.history || (newData === oldData)) return newStructure;

    emitter.history = emitter.history
      .take(++emitter._currentRevision)
      .push(emitter.current);

    return newStructure;
  };
}

// Update history if history is active
var possiblyEmitAnimationFrameEvent = (function () {
  var queuedChange = false;
  if (typeof requestAnimationFrame !== 'function') {
    return function () {};
  }

  return function requestAnimationFrameEmitter (emitter, newStructure, oldData, keyPath) {
    if (queuedChange) return;
    queuedChange = true;

    requestAnimationFrame(function () {
      queuedChange = false;
      emitter.emit('next-animation-frame', newStructure, oldData, keyPath);
    });
  };
}());

// Emit swap event on values are swapped
function handleSwap (emitter, fn) {
  return function (newData, oldData, keyPath) {
    var newStructure = fn.apply(fn, arguments);
    if(newData === oldData) return newStructure;

    emitter.emit('swap', newStructure, oldData, keyPath);
    possiblyEmitAnimationFrameEvent(emitter, newStructure, oldData, keyPath);

    return newStructure;
  };
}

// Map changes to update events (delete/change/add).
function handlePersisting (emitter, fn) {
  return function (newData, oldData, path) {
    var newStructure = fn.apply(fn, arguments);
    if(newData === oldData) return newStructure;
    var info = analyze(newData, oldData, path);

    if (info.eventName) {
      emitter.emit.apply(emitter, [info.eventName].concat(info.args));
    }
    return newStructure;
  };
}

// Private helpers.

function removeAllListenersBut(self, pathId, listeners, except) {
  if (!listeners) return;
  listeners.forEach(function (fn) {
    if (except && fn === except) return;
    var index = self._pathListeners[pathId].indexOf(fn);
    self._pathListeners[pathId].splice(index, 1);
  });
}

function analyze (newData, oldData, path) {
  var oldObject = oldData && oldData.getIn(path);
  var newObject = newData && newData.getIn(path);

  var inOld = oldData && hasIn(oldData, path);
  var inNew = newData && hasIn(newData, path);

  var args, eventName;

  if (inOld && !inNew) {
    eventName = 'delete';
    args = [path, oldObject];
  } else if (inOld && inNew) {
    eventName = 'change';
    args = [path, newObject, oldObject];
  } else if (!inOld && inNew) {
    eventName = 'add';
    args = [path, newObject];
  }

  return {
    eventName: eventName,
    args: args
  };
}


// Check if path exists.
var NOT_SET = {};
function hasIn(cursor, path) {
  if(cursor.hasIn) return cursor.hasIn(path);
  return cursor.getIn(path, NOT_SET) !== NOT_SET;
}

function pathString(path) {
  var topLevel = 'global';
  if (!path || !path.length) return topLevel;
  return [topLevel].concat(path).join('|');
}

function listListenerMatching (listeners, basePath) {
  var newListeners = [];
  for (var key in listeners) {
    if (!listeners.hasOwnProperty(key)) continue;
    if (basePath.indexOf(key) !== 0) continue;
    newListeners.push(listeners[key]);
  }

  return newListeners;
}

function onlyOnEvent(eventName, fn) {
  return function (newData, oldData, keyPath) {
    var info = analyze(newData, oldData, keyPath);
    if (info.eventName !== eventName) return;
    return fn(newData, oldData, keyPath);
  };
}

function isCursor (potential) {
  return potential && typeof potential.deref === 'function';
}

// Check if passed structure is existing immutable structure.
// From https://github.com/facebook/immutable-js/wiki/Upgrading-to-Immutable-v3#additional-changes
function isImmutableStructure (data) {
  return immutableSafeCheck('Iterable', 'isIterable', data) ||
          immutableSafeCheck('Seq', 'isSeq', data) ||
          immutableSafeCheck('Map', 'isMap', data) ||
          immutableSafeCheck('OrderedMap', 'isOrderedMap', data) ||
          immutableSafeCheck('List', 'isList', data) ||
          immutableSafeCheck('Stack', 'isStack', data) ||
          immutableSafeCheck('Set', 'isSet', data);
}

function immutableSafeCheck (ns, method, data) {
  return Immutable[ns] && Immutable[ns][method] && Immutable[ns][method](data);
}
