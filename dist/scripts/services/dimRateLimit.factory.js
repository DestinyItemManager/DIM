(function(angular) {
  "use strict";

  angular.module("dimApp")
    .factory("rateLimiterQueue", ["$interval", "$window", function rateLimiterQueue($interval, $window) {

    function RateLimiterQueue(pattern, requestLimit, timeLimit) {
      this.pattern = pattern;
      this.requestLimit = requestLimit;
      this.timeLimit = timeLimit || 1000;
      this.queue = [];
      this.count = 0;
      this.lastRequest = undefined;
      this.currentRequest = undefined;
      this.interval = undefined;
    }

    RateLimiterQueue.prototype.matches = function(url) {
      return url.match(this.pattern);
    };

    RateLimiterQueue.prototype.add = function(config, deferred) {
      this.queue.push({
        config: config,
        deferred: deferred
      });
    };

    RateLimiterQueue.prototype.remove = function(index) {
      this.queue.splice(index, 1);
    };

    RateLimiterQueue.prototype.startProcessing = function() {
      if (!angular.isDefined(this.interval)) {
        this.interval = $interval(this.processQueue.bind(this), this.timeLimit);
      }
    };

    RateLimiterQueue.prototype.stopProcessing = function() {
      if (angular.isDefined(this.interval)) {
        $interval.cancel(this.interval);
        this.interval = undefined;
      }
    };

    RateLimiterQueue.prototype.processQueue = function() {

      if (this.queue.length) {

        for (var i = 0; i < this.requestLimit; i++) {

          var request = this.queue[i];

          if (request) {
            this.process(request, i);
          }

        }

      } else {
        this.stopProcessing();
      }

    };

    RateLimiterQueue.prototype.process = function(request, index) {

      var timeSinceLastRequest;

      this.count++;
      this.currentRequest = $window.performance.now();

      if (!angular.isDefined(this.lastRequest)) {
        this.lastRequest = this.currentRequest;
      }

      timeSinceLastRequest = this.currentRequest - this.lastRequest;

      if (timeSinceLastRequest >= this.timeLimit) {
        this.count = 0;
      }

      if (this.count < this.requestLimit) {
        request.deferred.resolve(request.config);
        this.lastRequest = this.currentRequest;
        this.remove(index);
      } else {
        this.startProcessing();
      }

    };

    function RateLimiterQueueFactory(pattern, requestLimit, timeLimit) {
      return new RateLimiterQueue(pattern, requestLimit, timeLimit);
    }

    return RateLimiterQueueFactory;

  }])

  .provider("rateLimiterConfig", function rateLimiterConfig() {

    var limiterConfig = [],
      limiters = [];

    this.addLimiter = function(pattern, requestLimit, timeLimit) {
      limiterConfig.push({
        pattern: pattern,
        requestLimit: requestLimit,
        timeLimit: timeLimit
      });
    };

    this.$get = ["rateLimiterQueue", function(rateLimiterQueue) {

      while (limiterConfig.length) {
        var config = limiterConfig.shift();
        limiters.push(rateLimiterQueue(config.pattern, config.requestLimit, config.timeLimit));
      }

      return {
        getLimiters: function() {
          return limiters;
        }
      };
    }];

  })

  .factory("rateLimiterInterceptor", ["$q", "rateLimiterConfig", function rateLimiterInterceptor($q, rateLimiterConfig) {

    return {

      request: function(config) {

        var deferred = $q.defer(),
          queued = false;

        angular.forEach(rateLimiterConfig.getLimiters(), function(limiter) {
          if (limiter.matches(config.url)) {
            limiter.add(config, deferred);
            limiter.processQueue();
            queued = true;
          }
        });

        if (!queued) {
          deferred.resolve(config);
        }

        return deferred.promise;

      }
    };

  }]);

})(angular);




// (function(angular) {
//   'use strict';
//
//   angular.module('dimApp').factory('dimRateLimit', RateLimit);
//
//   RateLimit.$inject = ['$q'];
//
//   function RateLimit($q) {
//     var service = {
//       'rateLimit': RateLimitFn
//     };
//
//     return service;
//
//     function RateLimitFn(fn, delay, context) {
//       var queue = [];
//       var timer = null;
//
//       function processQueue() {
//         var item = queue.shift();
//
//         if (item) {
//           fn.apply(item.context, item.arguments);
//         }
//
//         if (queue.length === 0) {
//           clearInterval(timer);
//           timer = null;
//         }
//       }
//
//       return function limited() {
//         queue.push({
//           context: context || this,
//           arguments: [].slice.call(arguments)
//         });
//
//         if (!timer) {
//           processQueue(); // start immediately on the first invocation
//           timer = setInterval(processQueue, delay);
//         }
//       };
//     }
//   }
//
// })(angular);
