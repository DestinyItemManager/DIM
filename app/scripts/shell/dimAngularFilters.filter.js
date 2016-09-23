(function() {
  'use strict';

  // This file defines Angular filters for DIM that may be shared among
  // different parts of DIM.

  const mod = angular.module('dimApp');

  /**
   * Take an icon path and make a full Bungie.net URL out of it
   */
  mod.filter('bungieIcon', ['$sce', function($sce) {
    return function(icon) {
      return $sce.trustAsResourceUrl('https://www.bungie.net' + icon);
    };
  }]);

  /**
   * Set the background-image of an element to a bungie icon URL.
   */
  mod.filter('bungieBackground', function() {
    return function backgroundImage(value) {
      return {
        'background-image': 'url(https://www.bungie.net' + value + ')'
      };
    };
  });

  /**
   * Filter a list of items down to only the equipped (or unequipped) items.
   * Usage: items | equipped:true
   */
  mod.filter('equipped', function() {
    return function(items, isEquipped) {
      return _.select(items || [], function(item) {
        return item.equipped === isEquipped;
      });
    };
  });

  /**
   * Sort the stores according to the user's preferences (via the order parameter).
   */
  mod.filter('sortStores', function() {
    return function sortStores(stores, order) {
      if (order === 'mostRecent') {
        return _.sortBy(stores, 'lastPlayed').reverse();
      } else if (order === 'mostRecentReverse') {
        return _.sortBy(stores, function(store) {
          if (store.isVault) {
            return Infinity;
          } else {
            return store.lastPlayed;
          }
        });
      } else {
        return _.sortBy(stores, 'id');
      }
    };
  });

  /**
   * Sort items according to the user's preferences (via the sort parameter).
   */
  mod.filter('sortItems', function() {
    return function(items, sort) {
      // Don't resort postmaster items - that way people can see
      // what'll get bumped when it's full.
      if (items.length && items[0].location.inPostmaster) {
        return items;
      }
      items = _.sortBy(items || [], 'name');
      if (sort === 'primaryStat' || sort === 'rarityThenPrimary' || sort === 'quality') {
        items = _.sortBy(items, function(item) {
          return (item.primStat) ? (-1 * item.primStat.value) : 1000;
        });
      }
      if (sort === 'quality') {
        items = _.sortBy(items, function(item) {
          return item.quality && item.quality.min ? -item.quality.min : 1000;
        });
      }
      if (sort === 'rarity' || sort === 'rarityThenPrimary') {
        items = _.sortBy(items, function(item) {
          switch (item.tier) {
          case 'Exotic':
            return 0;
          case 'Legendary':
            return 1;
          case 'Rare':
            return 2;
          case 'Uncommon':
            return 3;
          case 'Common':
            return 4;
          default:
            return 5;
          }
        });
      }
      return items;
    };
  });

  /**
   * A filter that will heatmap-color a background according to a percentage.
   */
  mod.filter('qualityColor', function() {
    return function getColor(value, property) {
      property = property || 'background-color';
      var color = 0;
      if (value <= 85) {
        color = 0;
      } else if (value <= 90) {
        color = 20;
      } else if (value <= 95) {
        color = 60;
      } else if (value <= 99) {
        color = 120;
      } else if (value >= 100) {
        color = 190;
      } else {
        return 'white';
      }
      var result = {};
      result[property] = 'hsl(' + color + ',85%,60%)';
      return result;
    };
  });

  /**
   * Reduce a string to its first letter.
   */
  mod.filter('firstLetter', function() {
    return function(str) {
      return str.substring(0, 1);
    };
  });

  /**
   * inserts the evaluated value of the "svg-bind-viewbox" attribute
   * into the "viewBox" attribute, making sure to capitalize the "B",
   * as this SVG attribute name is case-sensitive.
   */
  mod.directive('svgBindViewbox', function() {
    return {
      link: function(scope, element, attrs) {
        attrs.$observe('svgBindViewbox', function(value) {
          element.get(0).setAttribute('viewBox', value);
        });
      }
    };
  });
})();
