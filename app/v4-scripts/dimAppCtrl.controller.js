(function() {
  'use strict';

  angular.module('dim').controller('dimAppCtrl', AppCtrl);

  function AppCtrl() {
    var characters = [];
    var vault = {};
    var loadout = null;
    var index = 0;

    var character = {
      class: 'Warlock',
      subclass: 'Sunsinger',
      level: 34,
      lightLevel: 280,
      race: 'Exo',
      sex: 'Female',
      engram: 'http://www.bungie.net/common/destiny_content/icons/aafa2e55f71e2f88156bfef6d8fda0b8.jpg',
      items: []
    };

    character.items.push.apply(character.items, makeItems('primary', '6871909234b94f192e2f94153536ef04', 8));
    character.items.push.apply(character.items, makeItems('secondary', '32ee4898d395699de588756b963e26dd', 9));
    character.items.push.apply(character.items, makeItems('heavy', 'eb8377390504838c0190d8d56e70d28e', 7));

    characters.push(character);

    function makeItems(type, image, amount) {
      var result = [];

      for (var i = 0; i < amount; i++) {
        var item = {
          index: index,
          single: false,
          double: false,
          type: type,
          equipped: false,
          image: 'http://www.bungie.net/common/destiny_content/icons/' + image + '.jpg'
        }

        index = index + 1;

        item.equipped = (i === 0);

        result.push(item);
      }

      return result;
    }

    function getItemsByType(source, type) {
      return _.chain(source.items)
        .filter(function(item) {
          return item.type === type;
        })
        .groupBy(function(item) {
          return item.equipped ? 'equipped' : 'unequipped';
        })
        .value();
    }

    function single(item) {
      if (isItemSelected(item)) {
        if (controller.multiselectEnabled) {
          var index = _.findIndex(controller.selectedItems, function(selectedItem) {
            return selectedItem.index === item.index;
          });

          controller.selectedItems.splice(index, 1);
        } else {
          controller.selectedItems.splice(0, controller.selectedItems.length);
        }
      } else {
        if (!controller.multiselectEnabled) {
          controller.selectedItems.splice(0, controller.selectedItems.length);
        }

        controller.selectedItems.push(item);
      }
    }

    function double(item) {
      //item.single = !item.single;
      if (controller.multiselectEnabled) {
        controller.selectedItems.splice(0, controller.selectedItems.length);
      } else {
        single(item);
      }
      
      controller.multiselectEnabled = !controller.multiselectEnabled;
    }

    function isItemSelected(item) {
      return _.some(controller.selectedItems, function(selectedItem) {
        return selectedItem.index === item.index;
      });
    }

    var controller = {
      multiselectEnabled: false,
      selectedItems: [],
      characters: characters,
      vault: vault,
      loadout: loadout,
      current: characters[0],
      types: [
        'primary',
        'secondary',
        'heavy'
      ],
      getItemsByType: getItemsByType,
      single: single,
      double: double,
      isItemSelected: isItemSelected
    }

    return controller;
  };
})();
