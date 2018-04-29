import template from './dimStats.directive.html';
import './dimStats.scss';
import { IComponentOptions, IController, IScope } from 'angular';

export const StatsComponent: IComponentOptions = {
  controller: StatsCtrl,
  controllerAs: 'vm',
  bindings: {
    destinyVersion: '<',
    stats: '<'
  },
  template
};

function StatsCtrl(this: IController, $scope: IScope, $i18next) {
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
          const tier = stat.tier || 0;
          const next = $i18next.t('Stats.TierProgress', { context: tier === 5 ? 'Max' : '', progress: tier === 5 ? stat.value : (stat.value % 60), tier, nextTier: tier + 1, statName: stat.name });
          let cooldown = stat.cooldown || '';
          if (cooldown) {
            cooldown = $i18next.t(`Cooldown.${stat.effect}`, { cooldown });
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
