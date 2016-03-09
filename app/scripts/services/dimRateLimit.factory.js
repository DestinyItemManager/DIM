(function(angular) {
  "use strict";

  angular.module("dimApp")
    .factory("rateLimiterQueue", ["$timeout", "$window", function rateLimiterQueue($timeout, $window) {

      function RateLimiterQueue(pattern, requestLimit, timeLimit) {
        this.pattern = pattern;
        this.requestLimit = requestLimit;
        this.timeLimit = timeLimit || 1000;
        this.queue = [];
        this.count = 0; // number of requests in the current period
        this.lastRequestTime = $window.performance.now();
        this.timer = undefined;
      }

      angular.extend(RateLimiterQueue.prototype, {
        matches: function(url) {
          return url.match(this.pattern);
        },

        // Add a request to the queue, acting on it immediately if possible
        add: function(config, deferred) {
          this.queue.push({
            config: config,
            deferred: deferred
          });
          this.processQueue();
        },

        // Schedule processing the queue at the next soonest time.
        scheduleProcessing: function() {
          if (!angular.isDefined(this.interval)) {
            var nextTryIn = Math.max(0, this.timeLimit - ($window.performance.now() - this.lastRequestTime));
            this.timer = $timeout(function() {
              this.timer = undefined;
              this.processQueue();
            }.bind(this), nextTryIn);
          }
        },

        processQueue: function() {
          do {
            if (this.canProcess()) {
              var request = this.queue.shift();
              request.deferred.resolve(request.config);
            } else {
              this.scheduleProcessing();
              return;
            }
          } while(this.queue.length);
        },

        // Returns whether or not we can process a request right now. Mutates state.
        canProcess: function() {
          var currentRequestTime = $window.performance.now();

          var timeSinceLastRequest = currentRequestTime - this.lastRequestTime;
          if (timeSinceLastRequest >= this.timeLimit) {
            this.lastRequestTime = currentRequestTime;
            this.count = 0;
          }

          if (this.count < this.requestLimit) {
            this.count++;
            return true;
          } else {
            return false;
          }
        }
      });

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
        var limiter = _.find(rateLimiterConfig.getLimiters(), function(l) {
          return l.matches(config.url);
        });

        if (limiter) {
          var deferred = $q.defer();
          limiter.add(config, deferred);
          return deferred.promise;
        } else {
          return config;
        }
      }
    };

  }]);

})(angular);
