'use strict';
var Structure = require('./src/structure');

function Immstruct () {
  if (!(this instanceof Immstruct)) {
    return new Immstruct();
  }

  this.instances = {};
}

Immstruct.prototype.get = function (key, data) {
  return getInstance(this, {
    key: key,
    data: data
  });
};

Immstruct.prototype.clear = function () {
  this.instances = {};
};

Immstruct.prototype.remove = function (key) {
  return delete this.instances[key];
};

Immstruct.prototype.withHistory = function (key, data) {
  return getInstance(this, {
    key: key,
    data: data,
    history: true
  });
};

var inst = new Immstruct();

module.exports = function (key, data) {
  return getInstance(inst, {
    key: key,
    data: data
  });
};

module.exports.withHistory = function (key, data) {
  return getInstance(inst, {
    key: key,
    data: data,
    history: true
  });
};

module.exports.Structure = Structure;
module.exports.Immstruct = Immstruct;
module.exports.clear = inst.clear.bind(inst);
module.exports.remove = inst.remove.bind(inst);
Object.defineProperty(module.exports, 'instances', {
  get: function() { return inst.instances; },
  enumerable: true,
  configurable: true
});

function getInstance (obj, options) {
  if (typeof options.key === 'object') {
    options.data = options.key;
    options.key = void 0;
  }

  if (options.key && obj.instances[options.key]) {
    return obj.instances[options.key];
  }

  var newInstance = new Structure(options);
  obj.instances[newInstance.key] = newInstance;
  return newInstance;
}