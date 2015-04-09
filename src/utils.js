'use strict';

module.exports.generateRandomKey = function (len) {
  len = len || 10;
  return Math.random().toString(36).substring(2).substring(0, len);
};

module.exports.deepGet = function(collection, path) {
  var current = collection,
      path = path || [];

  path.forEach(function(property) {
    if (current && property in current) {
      current = current[property];
    } else {
      current = undefined;
      return false;
    }
  });

  return current;
};

module.exports.deepSet = function(collection, path, value) {
  var currentObject = collection,
      path = path || [];

  path.forEach(function(property, index) {
    if (index + 1 === path.length) {
      currentObject[property] = value;
    } else if (!currentObject[property]) {
      currentObject[property] = {};
    }
    currentObject = currentObject[property];
  });

  return collection;
};