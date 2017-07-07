import _ from 'underscore';

import template from './activities.html';
import './activities.scss';

function ActivitiesController($scope, dimStoreService, dimDefinitions, dimSettingsService, $translate) {
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

    const whitelist = [
      'vaultofglass',
      'crota',
      'kingsfall',
      'wrathofthemachine',
      // 'elderchallenge',
      'nightfall',
      'heroicstrike',
    ];

    dimDefinitions.getDefinitions().then((defs) => {
      const rawActivities = stores[0].advisors.activities;
      vm.activities = _.filter(rawActivities, (a) => {
        return a.activityTiers && whitelist.includes(a.identifier);
      })
      vm.activities = _.sortBy(vm.activities, (a) => {
        const ix = whitelist.indexOf(a.identifier);
        return (ix === -1) ? 999 : ix;
      }).map((a) => processActivities(defs, stores, a));

      vm.activities.forEach((a) => {
        a.tiers.forEach((t) => {
          if (t.hash === stores[0].advisors.activities.weeklyfeaturedraid.display.activityHash) {
            a.featured = true;
          }
        });
      });
    });
  }

  init();

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });

  function processActivities(defs, stores, rawActivity) {
    const activity = {
      hash: rawActivity.display.activityHash,
      // having trouble finding the i18n version of the name.
      name: rawActivity.display.advisorTypeCategory,
      icon: rawActivity.display.icon,
      image: rawActivity.display.image,
    };

    if (rawActivity.extended) {
      activity.skulls = rawActivity.extended.skullCategories.map((s) => {
        return s.skulls;
      });
    }

    const rawSkullCategories = rawActivity.activityTiers[0].skullCategories;
    if (rawSkullCategories && rawSkullCategories.length) {
      activity.skulls = rawSkullCategories[0].skulls;
    }

    // flatten modifiers and bonuses for now.
    // unfortunetly skulls don't have a hash w/ them so no i18n.
    if (activity.skulls) {
      activity.skulls = _.flatten(activity.skulls);
    }

    activity.tiers = rawActivity.activityTiers.map((r, i) => processActivity(defs, rawActivity.identifier, stores, r, i));

    return activity;
  }

  function processActivity(defs, activityId, stores, tier, index) {
    const tierDef = defs.Activity[tier.activityHash];

    const name = tier.activityData.recommendedLight === 390 ? 390
      : (tier.tierDisplayName ? $translate.instant(`Activities.${tier.tierDisplayName}`) : tierDef.activityName);

    const characters = activityId === 'heroicstrike' ? [] : stores.map((store) => {
      let steps = store.advisors.activities[activityId].activityTiers[index].steps;

      if (!steps) {
        steps = [store.advisors.activities[activityId].activityTiers[index].completion];
      }

      return {
        name: store.name,
        icon: store.icon,
        steps: steps
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
