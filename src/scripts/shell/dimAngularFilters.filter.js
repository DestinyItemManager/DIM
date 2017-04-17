import angular from 'angular';
import _ from 'underscore';

// This file defines Angular filters for DIM that may be shared among
// different parts of DIM.

const mod = angular.module('dimApp');

/**
 * Take an icon path and make a full Bungie.net URL out of it
 */
mod.filter('bungieIcon', function($sce) {
  return function(icon) {
    return $sce.trustAsResourceUrl('https://www.bungie.net' + icon);
  };
});

/**
 * Set the background-image of an element to a bungie icon URL.
 */
mod.filter('bungieBackground', function() {
  return function backgroundImage(value) {
    if (!value) {
      return {};
    }

    // Hacky workaround so we can reference local images
    if (value.startsWith('~')) {
      const baseUrl = ($DIM_FLAVOR === 'dev')
              ? ''
              : 'https://beta.destinyitemmanager.com';
      return {
        'background-image': 'url(' + baseUrl + value.substr(1) + ')'
      };
    }
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
    var dontsort = ["BUCKET_BOUNTIES", "BUCKET_MISSION", "BUCKET_QUESTS", "BUCKET_POSTMASTER"];
    if (items.length && dontsort.includes(items[0].location.id)) {
      return items;
    }

    var specificSortOrder = [];
    // Group like items in the General Section
    if (items.length && items[0].location.id === "BUCKET_CONSUMABLES") {
      specificSortOrder = [
        1043138475, // black-wax-idol
        1772853454, // blue-polyphage
        3783295803, // ether-seeds
        3446457162, // resupply-codes
        269776572,  // house-banners
        3632619276, // silken-codex
        2904517731, // axiomatic-beads
        1932910919, // network-keys
        //
        417308266,  // three of coins
        //
        2180254632, // ammo-synth
        928169143,  // special-ammo-synth
        211861343,  // heavy-ammo-synth
        //
        705234570,  // primary telemetry
        3371478409, // special telemetry
        2929837733, // heavy telemetry
        4159731660, // auto rifle telemetry
        846470091,  // hand cannon telemetry
        2610276738, // pulse telemetry
        323927027,  // scout telemetry
        729893597,  // fusion rifle telemetry
        4141501356, // shotgun telemetry
        927802664,  // sniper rifle telemetry
        1485751393, // machine gun telemetry
        3036931873, // rocket launcher telemetry
        //
        2220921114, // vanguard rep boost
        1500229041, // crucible rep boost
        1603376703, // HoJ rep boost
        //
        2575095887, // Splicer Intel Relay
        3815757277, // Splicer Cache Key
        4244618453  // Splicer Key
      ];
    }

    // Group like items in the General Section
    if (items.length && items[0].location.id === "BUCKET_MATERIALS") {
      specificSortOrder = [
        1797491610, // Helium
        3242866270, // Relic Iron
        2882093969, // Spin Metal
        2254123540, // Spirit Bloom
        3164836592, // Wormspore
        3164836593, // Hadium Flakes
        //
        452597397,  // Exotic Shard
        1542293174, // Armor Materials
        1898539128, // Weapon Materials
        //
        937555249, // Motes of Light
        //
        1738186005, // Strange Coins
        //
        258181985,  // Ascendant Shards
        1893498008, // Ascendant Energy
        769865458,  // Radiant Shards
        616706469,  // Radiant Energy
        //
        342707701,  // Reciprocal Rune
        342707700,  // Stolen Rune
        2906158273, // Antiquated Rune
        2620224196, // Stolen Rune (Charging)
        2906158273  // Antiquated Rune (Charging)
      ];
    }

    if (specificSortOrder.length > 0 && sort !== 'rarityThenPrimary') {
      items = _.sortBy(items, function(item) {
        var ix = specificSortOrder.indexOf(item.hash);
        return (ix === -1) ? 999 : ix;
      });
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
    if (sort === 'rarityThenPrimary' || (items.length && items[0].location.inGeneral)) {
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
    if (value < 0) {
      return { [property]: 'white' };
    } else if (value <= 85) {
      color = 0;
    } else if (value <= 90) {
      color = 20;
    } else if (value <= 95) {
      color = 60;
    } else if (value <= 99) {
      color = 120;
    } else if (value >= 100) {
      color = 190;
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
 * Filter to turn a number into an array so that we can use ng-repeat
 * over a number to loop N times.
 */
mod.filter('range', function(){
  return function(n) {
    return new Array(n);
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

