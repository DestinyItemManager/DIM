const angular = require('angular');

(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimWebNotifier', WebNotifier)
    .run(['dimNotificationsService', 'dimWebNotifier', (dimNotificationsService, dimWebNotifier) => {
      dimNotificationsService.registerNotifier(dimWebNotifier);
    }]);

  function WebNotifier() {
    return {
      notify: (notification) => {
        // Ideally these checks would be done as part of setting up the settings page/when settings are changed
        // Let's check if the browser supports notifications
        if ("Notification" in window) {
          const options = {
            body: notification.body,
            icon: notification.icon
          };
          if (Notification.permission === "granted") {
            const notificationObject = new Notification(notification.title, options);
          }
          // Otherwise, we need to ask the user for permission
          else if (Notification.permission !== 'denied') {
            Notification.requestPermission((permission) => {
              // If the user accepts, let's create a notification
              if (permission === "granted") {
                var notificationObject = new Notification(notification.title, options);
              }
            });
          }
        }
      }
    };
  }
})();