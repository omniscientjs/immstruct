'use strict';

module.exports.generateRandomKey = function (len) {
  len = len || 10;
  return Math.random().toString(36).substring(2).substring(0, len);
};


// a basic Map that supports object keys
function Map(keys, values) {return new _Map(keys, values)}
module.exports.Map = Map;

function _Map(keys, values) {this.clear(keys, values);}
_Map.prototype = {

  set: function(key, value) {
    var i = this.indexOf(key);
    this._keys[i] = key;
    this._values[i] = value;
    return i !== this._keys.length;
  },

  get: function(key) {
    var i = this.indexOf(key);
    return this._values[i];
  },

  remove: function(key) {
    var i = this.indexOf(key);
    if (i !== this._keys.length) {
      this._keys.splice(i, 1);
      this._values.splice(i, 1);
    }
    return this;
  },

  clear: function(keys, values) {
    this._keys = keys || [];
    this._values = values || [];
    return this;
  },

  indexOf: function(key) {
    var i = this._keys.indexOf(key);
    return i === -1 ? this._keys.length : i;
  },

  deepGet: function(keyPath) {
    var current = this,
        keyPath = keyPath || [],
        key;

    for(var i= 0, len=keyPath.length; i<len; i++) {
      key = keyPath[i];
      current = current.get(key);
      if (current === undefined) {
        break;
      }
    }

    return current;
  },

  deepSet: function(keyPath, value) {
    var current = this,
        keyPath = keyPath || [],
        _cur;

    keyPath.forEach(function(key, index) {
      if (index + 1 === keyPath.length) {
        current.set(key, value);
      } else {
        _cur = current.get(key);
        if (!_cur) {
          _cur = Map();
          current.set(key, _cur);
        }
        current = _cur;
      }
    });

    return this;
  }
};