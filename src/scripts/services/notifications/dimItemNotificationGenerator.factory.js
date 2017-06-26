const angular = require('angular');
const _ = require('underscore');

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

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
          const newItems = shuffle(_.filter(store.items, function(item) { return !item.notransfer && item.equipment && !item.classified && _.indexOf(alreadyNotified, item.id) < 0; }));
          if (newItems.length > 0) {
            const bodyString = "You recieved " + newItems[0].name + (newItems.length > 1 ? (" and " + (newItems.length - 1) + " other items!") : "!");
            _.each(newItems, (item) => {
              alreadyNotified.push(item.id);
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
