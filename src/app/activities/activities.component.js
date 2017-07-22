import _ from 'underscore';

import template from './activities.html';
import './activities.scss';

export const ActivitiesComponent = {
  controller: ActivitiesController,
  template,
  bindings: {
    account: '<'
  }
};

function ActivitiesController($scope, dimStoreService, dimDefinitions, dimSettingsService, $i18next) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;

  vm.settingsChanged = function() {
    vm.settings.save();
  };

  // TODO: it's time for a directive
  vm.toggleSection = function(id) {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  this.$onInit = function() {
    dimStoreService.getStoresStream(vm.account).subscribe(init);
  };

  $scope.$on('dim-refresh', () => {
    // TODO: refresh just advisors
    dimStoreService.reloadStores();
  });

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  function init(stores) {
    if (_.isEmpty(stores)) {
      return;
    }

    vm.stores = stores = stores.filter((s) => s.id !== 'vault');

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
      });
      vm.activities = _.sortBy(vm.activities, (a) => {
        const ix = whitelist.indexOf(a.identifier);
        return (ix === -1) ? 999 : ix;
      }).map((a) => processActivities(defs, stores, a));

      vm.activities.forEach((a) => {
        a.tiers.forEach((t) => {
          if (t.hash === stores[0].advisors.activities.weeklyfeaturedraid.display.activityHash) {
            a.featured = true;
            t.name = t.hash === 1387993552 ? '390' : t.name;
          }
        });
      });
    });
  }

  function processActivities(defs, stores, rawActivity) {
    const def = defs.Activity.get(rawActivity.display.activityHash);
    const activity = {
      hash: rawActivity.display.activityHash,
      name: def.activityName,
      icon: rawActivity.display.icon,
      image: rawActivity.display.image,
      type: rawActivity.identifier === "nightfall" ? $i18next.t('Activities.Nightfall')
        : rawActivity.identifier === "heroicstrike" ? $i18next.t('Activities.WeeklyHeroic')
          : defs.ActivityType.get(def.activityTypeHash).activityTypeName
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

    if (activity.skulls && vm.settings.language !== 'en') {
      activity.skulls = i18nActivitySkulls(activity.skulls, defs);
    }

    // flatten modifiers and bonuses for now.
    if (activity.skulls) {
      activity.skulls = _.flatten(activity.skulls);
    }

    activity.tiers = rawActivity.activityTiers.map((r, i) => processActivity(defs, rawActivity.identifier, stores, r, i));

    return activity;
  }

  function processActivity(defs, activityId, stores, tier, index) {
    const tierDef = defs.Activity.get(tier.activityHash);

    const name = tier.activityData.recommendedLight === 390 ? 390
      : (tier.tierDisplayName ? $i18next.t(`Activities.${tier.tierDisplayName}`) : tierDef.activityName);

    const characters = activityId === 'heroicstrike' ? [] : stores.map((store) => {
      let steps = store.advisors.activities[activityId].activityTiers[index].steps;

      if (!steps) {
        steps = [store.advisors.activities[activityId].activityTiers[index].completion];
      }

      return {
        name: store.name,
        lastPlayed: store.lastPlayed,
        id: store.id,
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

  function i18nActivitySkulls(skulls, defs) {
    const skullHashes = [
      { displayName: "Heroic", hash: 0 },
      { displayName: "Arc Burn", hash: 1 },
      { displayName: "Solar Burn", hash: 2 },
      { displayName: "Void Burn", hash: 3 },
      { displayName: "Berserk", hash: 4 },
      { displayName: "Brawler", hash: 5 },
      { displayName: "Lightswitch", hash: 6 },
      { displayName: "Small Arms", hash: 7 },
      { displayName: "Specialist", hash: 8 },
      { displayName: "Juggler", hash: 9 },
      { displayName: "Grounded", hash: 10 },
      { displayName: "Bloodthirsty", hash: 11 },
      { displayName: "Chaff", hash: 12 },
      { displayName: "Fresh Troops", hash: 13 },
      { displayName: "Ironclad", hash: 14 },
      { displayName: "Match Game", hash: 15 },
      { displayName: "Exposure", hash: 16 },
      { displayName: "Airborne", hash: 17 },
      { displayName: "Catapult", hash: 18 },
      { displayName: "Epic", hash: 20 }];

    for (let i = 0, hash; i < skulls[0].length; i++) {
      hash = _.where(skullHashes, { displayName: skulls[0][i].displayName });
      hash = hash.length ? hash[0].hash : -1;
      if (hash >= 0) {
        if (hash < 20) { // set all skulls except for epic from heroic playlist...
          skulls[0][i].displayName = defs.Activity.get(870614351).skulls[hash].displayName;
          skulls[0][i].description = defs.Activity.get(870614351).skulls[hash].description;
        } else { // set Epic skull based off of a nightfall
          skulls[0][i].displayName = defs.Activity.get(2234107290).skulls[0].displayName;
          skulls[0][i].description = defs.Activity.get(2234107290).skulls[0].description;
        }
      }
    }
    return skulls;
  }
}
