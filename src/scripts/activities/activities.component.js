import _ from 'underscore';
import angular from 'angular';
import { sum, count } from '../util';

import template from './activities.html';
import './activities.scss';

function ActivitiesController($scope, dimStoreService, dimDefinitions, dimSettingsService, $filter) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;

  // TODO: it's time for a directive
  vm.toggleSection = function(id) {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  vm.settingsChanged = function() {
    vm.settings.save();
  };

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  // TODO: it'll be nice to replace this pattern with RxJS observables
  function init(stores = dimStoreService.getStores()) {
    if (_.isEmpty(stores)) {
      return;
    }

    stores = stores.filter((s) => s.id !== 'vault');

    var whitelist = [
      'vaultofglass',
      'crota',
      'kingsfall',
      'wrathofthemachine',
//      'elderchallenge',
      'nightfall',
      'heroicstrike',
    ];

    dimDefinitions.getDefinitions().then((defs) => {
      const rawActivities = stores[0].advisors.activities;
      vm.activities = _.chain(rawActivities)
        .filter('activityTiers') // exclude trials, iron banner, armsday, xur
        .filter((a) => {
          return whitelist.includes(a.identifier);
        })
        .sortBy((a) => {
          const ix = whitelist.indexOf(a.identifier);
          return (ix === -1) ? 999 : ix;
//          return -a.display.categoryHash;
        })
        .map((a) => processActivities(defs, stores, a))
        .value();

      vm.activities.forEach((a) => {
        a.tiers.forEach((t) => {
          if (t.hash === stores[0].advisors.activities.weeklyfeaturedraid.display.activityHash) {
            a.featured = true;
          }
        });
      })
    });
  }

  init();

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });

  function processActivities(defs, stores, rawActivity) {
    const activityDef = defs.Activity[rawActivity.display.activityHash];

    const activity = {
      hash: rawActivity.display.activityHash,
      name: rawActivity.display.advisorTypeCategory,
      icon: rawActivity.display.icon,
      image: rawActivity.display.image,
      description: activityDef.activityDescription,
    };

    if (rawActivity.extended) {
      activity.skulls = rawActivity.extended.skullCategories.map((s) => {
        return s.skulls;
      }).reduce((a, b) => {
        return a.concat(b)
      });
    }

    if (rawActivity.activityTiers[0].skullCategories && rawActivity.activityTiers[0].skullCategories.length) {
      activity.skulls = rawActivity.activityTiers[0].skullCategories[0].skulls;
    }

    activity.tiers = rawActivity.activityTiers.map((r, i) => processActivity(defs, rawActivity.identifier, stores, r, i));

    return activity;
  }

  function processActivity(defs, activityId, stores, tier, index) {
    const tierDef = defs.Activity[tier.activityHash];

    const name = tier.activityData.recommendedLight === 390 ? 390 :
      (tier.tierDisplayName ? tier.tierDisplayName : tierDef.activityName);

    const characters = stores.map((store) => {
      return {
        name: store.name,
        icon: store.icon,
        steps: store.advisors.activities[activityId].activityTiers[index].steps
      };
    });

    return {
      hash: tierDef.activityHash,
      icon: tierDef.icon,
      name: name,
      complete: tier.activityData.isCompleted,
      characters: characters
    };
  }
}

export const ActivitiesComponent = {
  controller: ActivitiesController,
  template: template
};
