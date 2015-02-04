var Structure = require('./src/structure');

module.exports = function (key, data) {
  return getInstance({
    key: key,
    data: data
  });
};

module.exports.instances = {};

module.exports.withHistory = function (key, data) {
  return getInstance({
    key: key,
    data: data,
    history: true
  });
};

module.exports.Structure = Structure;

function getInstance (options) {
  if (typeof options.key === 'object') {
    options.data = options.key;
    options.key = void 0;
  }

  if (options.key && module.exports.instances[options.key]) {
    return module.exports.instances[options.key];
  }

  var newInstance = new Structure(options);
  module.exports.instances[newInstance.key] = newInstance;
  return newInstance;
}

module.exports.clear = function () {
  module.exports.instances = {};
};

module.exports.remove = function (key) {
  return delete module.exports.instances[key];
};
