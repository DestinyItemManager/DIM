import angular from 'angular';

angular.module('dimApp')
  .factory('dimActionQueue', ActionQueue);

// A queue of actions that will execute one after the other
function ActionQueue($q) {
  const _queue = [];
  return {
    // fn is either a blocking function or a function that returns a promise
    queueAction: function(fn) {
      let promise = (_queue.length) ? _queue[_queue.length - 1] : $q.when();
      // Execute fn regardless of the result of the existing promise. We
      // don't use finally here because finally can't modify the return value.
      promise = promise.then(() => {
        return fn();
      }, () => {
        return fn();
      }).finally(() => {
        _queue.shift();
      });
      _queue.push(promise);
      return promise;
    },

    // Wrap a function to produce a function that will be queued
    wrap: function(fn, context) {
      const self = this;
      return function(...args) {
        return self.queueAction(() => {
          return fn.apply(context, args);
        });
      };
    }
  };
}

