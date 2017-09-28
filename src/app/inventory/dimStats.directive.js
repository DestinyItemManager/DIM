import template from './dimStats.directive.html';
import './dimStats.scss';

export const StatsComponent = {
  controller: StatsCtrl,
  controllerAs: 'vm',
  bindings: {
    destinyVersion: '<',
    stats: '<'
  },
  template
};


function StatsCtrl($scope, $i18next) {
  'ngInject';

  const vm = this;

  $scope.$watch('vm.stats', () => {
    if (!vm.stats) {
      vm.statList = [];
      return;
    }

    vm.statList = vm.destinyVersion === 1 ? [
      vm.stats.STAT_INTELLECT,
      vm.stats.STAT_DISCIPLINE,
      vm.stats.STAT_STRENGTH
    ] : [
      vm.stats.maxBasePower,
      vm.stats[2996146975],
      vm.stats[392767087],
      vm.stats[1943323491]
    ];
    vm.statList.forEach((stat) => {
      if (stat) {
        // compute tooltip
        if (vm.destinyVersion === 1) {
          const tier = stat.tier;
          const next = $i18next.t('Stats.TierProgress', { context: tier === 5 ? 'Max' : '', progress: tier === 5 ? stat.value : (stat.value % 60), tier: tier, nextTier: tier + 1, statName: stat.name });
          let cooldown = stat.cooldown || '';
          if (cooldown) {
            cooldown = $i18next.t(`Cooldown.${stat.effect}`, { cooldown: cooldown });
          }
          stat.tooltip = next + cooldown;
        } else {
          stat.tooltip = `${stat.name}: ${stat.value} / ${stat.tierMax}`;
        }

        if (stat.hasClassified) {
          stat.tooltip += `\n\n${$i18next.t('Loadouts.Classified')}`;
        }
      }
    });
  });
}
