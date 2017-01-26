const angular = require('angular');
const _ = require('underscore');

(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimNotificationsService', NotificationsService);


  function NotificationsService() {
    const generators = []; // For settings purposes
    const notifiers = []; // For settings and shuttling purposes

    return {
      registerNotificationGenerator: function(generatorDetails) {
        generatorDetails.isActive = true;
        // Assuming on for prototype
        generators.push(generatorDetails);
        return function sendNotification(notification) {
          if (generatorDetails.isActive) {
            _.each(notifiers, (notifier) => {
              if (notifier.isActive) {
                notifier.service.notify(notification);
              }
            });
          }
        };
      },
      registerNotifier: function(notifier) {
        notifiers.push({
          service: notifier,
          // Assuming on for prototype
          isActive: true
        });
      }
    };
  }
})();
