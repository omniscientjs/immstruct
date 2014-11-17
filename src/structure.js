var Immutable = require('immutable');
var Cursor = require('immutable/contrib/cursor');
var EventEmitter = require('eventemitter3').EventEmitter;
var inherits = require('inherits');
var utils = require('./utils');

inherits(Structure, EventEmitter);
function Structure (options) {
  options = options || {};
  if (!(this instanceof Structure)) {
    return new Structure(options);
  }

  this.key = options.key || utils.randString();

  if (options.data instanceof Immutable.Seq ||
      options.data instanceof Immutable.Map)
    this.current = options.data;
  else
    this.current = Immutable.fromJS(options.data || {});

  if (!!options.history) {
    this.history = Immutable.List.of(this.current);
    this._currentRevision = 0;
  }

  EventEmitter.call(this, arguments);
}

module.exports = Structure;

Structure.prototype.cursor = function (path) {
  var self = this;
  path = path || [];

  if (!this.current) {
    throw new Error('No structure loaded.');
  }

  var changeListener = function (newData, oldData, path) {
    return self.current = self.current.updateIn(path, function (data) {
      return newData.getIn(path);
    });
  };

  changeListener = handleHistory(this, changeListener);
  changeListener = handleUpdate(this, changeListener);
  changeListener = handlePersisting(this, changeListener);
  return Cursor.from(self.current, path, changeListener);
};

Structure.prototype.forceHasSwapped = function (newData, oldData) {
  this.emit('swap', newData || this.current, oldData);
};

Structure.prototype.undo = function(back) {
  this._currentRevision -= back || 1;
  if (this._currentRevision < 0) {
    this._currentRevision = 0;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

Structure.prototype.redo = function(head) {
  this._currentRevision += head || 1;
  if (this._currentRevision > this.history.count() - 1) {
    this._currentRevision = this.history.count() - 1;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

Structure.prototype.undoUntil = function(structure) {
  this._currentRevision = this.history.indexOf(structure);
  this.current = structure;

  return structure;
};

var possiblyEmitAnimationFrameEvent = (function () {
  var queuedChange = false;
  if (typeof requestAnimationFrame !== 'function') {
    return function () {};
  }

  return function requestAnimationFrameEmitter (emitter, newStructure, oldData) {
    if (queuedChange) return;
    queuedChange = true;

    requestAnimationFrame(function () {
      queuedChange = false;
      emitter.emit('next-animation-frame', newStructure, oldData);
    });
  };
}());

function handleHistory (emitter, fn) {
  return function (newData, oldData, path) {
    var newStructure = fn.apply(fn, arguments);
    if (!emitter.history) return newStructure;

    emitter.history = emitter.history
      .take(++emitter._currentRevision)
      .push(emitter.current);

    return newStructure;
  };
}

function handleUpdate (emitter, fn) {
  return function (newData, oldData, path) {
    var newStructure = fn.apply(fn, arguments);
    emitter.emit('swap', newStructure, oldData);
    possiblyEmitAnimationFrameEvent(emitter, newStructure, oldData);
    return newStructure;
  };
}

function handlePersisting (emitter, fn) {
  return function (newData, oldData, path) {
    var oldObject = oldData && oldData.getIn(path);
    var newObject = newData && newData.getIn(path);

    var inOld = !!oldObject;
    var inNew = !!newObject;

    if (inOld && !inNew && oldObject) {
      emitter.emit('delete', path, oldObject);
    } else if (inOld && inNew && oldObject && newObject) {
      emitter.emit('change', path, newObject, oldObject);
    } else if (newObject) {
      emitter.emit('add', path, newObject);
    }

    return fn.apply(fn, arguments);
  };
}

function revisionWarn () {
  var msg = 'immstruct: Immutable History is not activated. See `options.deactivateHistory`';
  console && console.warn && console.warn(msg);
}
