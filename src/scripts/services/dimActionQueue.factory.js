import angular from 'angular';

angular.module('dimApp')
  .factory('dimActionQueue', ActionQueue);

// A queue of actions that will execute one after the other
function ActionQueue($q) {
  var _queue = [];
  return {
    // fn is either a blocking function or a function that returns a promise
    queueAction: function(fn) {
      var promise = (_queue.length) ? _queue[_queue.length - 1] : $q.when();
      // Execute fn regardless of the result of the existing promise. We
      // don't use finally here because finally can't modify the return value.
      promise = promise.then(function() {
        return fn();
      }, function() {
        return fn();
      }).finally(function() {
        _queue.shift();
      });
      _queue.push(promise);
      return promise;
    },

    // Wrap a function to produce a function that will be queued
    wrap: function(fn, context) {
      var self = this;
      return function(...args) {
        return self.queueAction(function() {
          return fn.apply(context, args);
        });
      };
    }
  };
}

