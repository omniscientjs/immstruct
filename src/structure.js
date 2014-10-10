var Immutable = require('immutable');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var utils = require('./utils');


inherits(Structure, EventEmitter);
function Structure (options) {
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
  return self.current.cursor(path,
    handlePersisting(self,
      handleUpdate(self, function (newData, oldData, path) {
        self.current = newData;
      })
    )
  );
};

function handleUpdate (emitter, fn) {
  return function () {
    var original = fn.apply(fn, arguments);
    emitter.emit('swap');
    return original;
  };
}

function handlePersisting (emitter, fn) {
  return function (newData, oldData, path) {
    var oldObject = oldData.getIn(path);
    var newObject = newData.getIn(path);

    var inOld = !!oldObject;
    var inNew = !!newObject;

    if (inOld && !inNew) {
      emit(emitter, 'delete', path, oldObject);
    } else if (inOld && inNew) {
      emit(emitter, 'change', path, newObject, oldObject);
    } else {
      emit(emitter, 'add', path, newObject);
    }

    return fn.apply(fn, arguments);
  };
}

function emit (emitter, verb, path, object) {
  var url = path.join('/');
  if (typeof object.url === 'function') {
    url = object.url();
  } else if (typeof object.url === 'string') {
    url = object.url;
  }

  emitter.emit(verb, url, object);
}
