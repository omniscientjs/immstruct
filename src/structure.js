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
  this.current = Immutable.fromJS(options.data || {});

  EventEmitter.call(this, arguments);
}

module.exports = Structure;

Structure.prototype.cursor = function (path) {
  if (!this.current) {
    throw new Error('No structure loaded.');
  }

  path = path || [];

  var self = this;
  return Cursor.from(self.current, path,
    handlePersisting(self,
      handleUpdate(self, function (newData, oldData, path) {
        return self.current = self.current.updateIn(path, function (data) {
          return newData.getIn(path);
        });
      })
    )
  );
};

Structure.prototype.forceHasSwapped = function (newData, oldData) {
  this.emit('swap', newData || this.current, oldData);
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
