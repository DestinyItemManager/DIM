import angular from 'angular';
import template from './dimStats.directive.html';

angular.module('dimApp')
  .directive('dimStats', Stats);


function Stats() {
  return {
    controller: StatsCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {
      stats: '<'
    },
    template: template
  };
}


function StatsCtrl($scope, $i18next) {
  const vm = this;

  $scope.$watch('vm.stats', () => {
    if (!vm.stats) {
      vm.statList = [];
      return;
    }

    vm.statList = [vm.stats.STAT_INTELLECT, vm.stats.STAT_DISCIPLINE, vm.stats.STAT_STRENGTH];
    vm.statList.forEach((stat) => {
      // compute tooltip
      const tier = stat.tier;
      const next = $i18next.t('Stats.TierProgress', { context: tier === 5 ? 'Max' : '', progress: tier === 5 ? stat.value : (stat.value % 60), tier: tier, nextTier: tier + 1, statName: stat.name });
      let cooldown = stat.cooldown || '';
      if (cooldown) {
        cooldown = $i18next.t(`Cooldown.${stat.effect}`, { cooldown: cooldown });
      }
      stat.tooltip = next + cooldown;
    });
  });
}
