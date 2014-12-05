var Structure = require('./src/structure');

var instances = {};

module.exports = function (key, data) {
  return getInstance({
    key: key,
    data: data
  });
};

module.exports.withHistory = function (key, data) {
  return getInstance({
    key: key,
    data: data,
    history: true
  });
};

function getInstance (options) {
  if (typeof options.key === 'object') {
    options.data = options.key;
    options.key = void 0;
  }

  if (options.key && instances[options.key]) {
    return instances[options.key];
  }

  var newInstance = new Structure(options);
  instances[newInstance.key] = newInstance;
  return newInstance;
}

module.exports.clear = function () {
  instances = {};
};

module.exports.delete = function (key) {
  return delete instances[key];
};
