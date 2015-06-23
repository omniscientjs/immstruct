'use strict';

module.exports.generateRandomKey = function (len) {
  len = len || 10;
  return Math.random().toString(36).substring(2).substring(0, len);
};

// Variation shim based on the classic polyfill:
// http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
module.exports.raf = (function() {
  var glob = (typeof window === 'undefined') ? module : window;
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !glob.requestAnimationFrame; ++x) {
    glob.requestAnimationFrame = glob[vendors[x]+'RequestAnimationFrame'];
  }

  return function(callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = setTimeout(function() { callback(currTime + timeToCall); },
      timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}());
