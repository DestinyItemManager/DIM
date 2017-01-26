const angular = require('angular');
const _ = require('underscore');

(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemNotificationGenerator', ItemNotificationGenerator)
    .run(['dimItemNotificationGenerator', (dimItemNotificationGenerator) => {
      // Assuming on for prototype
      dimItemNotificationGenerator.start();
    }]);

  function ItemNotificationGenerator($rootScope, dimNotificationsService) {
    const createNotification = dimNotificationsService.registerNotificationGenerator({
      name: "Item Notification Generator",
      description: "I tell people when they get shiny new loot."
    });
    let cancelReloadListener;
    const alreadyNotified = [];

    // Ideally we'd start/stop this as the user turns it on/off to avoid unneeded processing.
    return {
      active: false,
      start: () => {
        var self = this;
        function checkForNewStuff(store) {
          if (!store) {
            return;
          }
          const newItems = _.filter(store.items, function(item) { return item.isNew && !item.notransfer && item.equipment && !item.classified && _.indexOf(alreadyNotified, item.id) >= 0; });
          if (newItems.length > 0) {
            const bodyString = "You recieved " + newItems[0].name + (newItems.length > 1 ? (" and " + (newItems.length - 1) + " other items!") : "!");
            _.each(newItems, (item) => {
              this.alreadyNotified.push(item.id);
            });
            createNotification({
              title: "New Loot!",
              body: bodyString,
              icon: 'https://www.bungie.net/' + newItems[0].icon
            });
          }
        }

        if (!this.active) {
          this.active = true;
          cancelReloadListener = $rootScope.$on('dim-stores-updated', function(e, data) {
            if (self.active) {
              checkForNewStuff(_.find(data.stores, (store) => {
                return store.current;
              }));
            }
          });
        }
      },
      stop: () => {
        if (cancelReloadListener) {
          cancelReloadListener();
        }
        this.active = false;
      }
    };
  }
})();
