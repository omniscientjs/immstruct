var Structure = require('./src/structure');

var instances = {};

module.exports = function (key, data) {
  if (typeof key === 'object') {
    data = key;
    key = void 0;
  }
  
  if (key && instances[key]) {
    return instances[key];
  }

  var newInstance = new Structure({
    key: key,
    data: data
  });

  instances[newInstance.key] = newInstance;
  return newInstance;
};
