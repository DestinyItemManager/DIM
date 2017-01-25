const angular = require('angular');
const _ = require('underscore');

(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimWebNotifier', WebNotifier)
   .run(['dimWebNotifier', (dimWebNotifier) => {}]);

  function WebNotifier(dimNotificationsService) {
    const svc = {
        notify: function(notification) {
            //Ideally these checks would be done as part of setting up the settings page/when settings are changed
            // Let's check if the browser supports notifications
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
            }
            else {
                let options = {
                    body: notification.body,
                    icon: notification.icon
                };
                if (Notification.permission === "granted") {
                    var notification = new Notification(notification.title, options);
                }

                // Otherwise, we need to ask the user for permission
                else if (Notification.permission !== 'denied') {
                    Notification.requestPermission(function (permission) {
                        // If the user accepts, let's create a notification
                        if (permission === "granted") {
                            var notification = new Notification(notification.title, options);
                        }
                    });
                }
            }
        }
    };
    dimNotificationsService.registerNotifier(svc);
    return svc;
  }
})();