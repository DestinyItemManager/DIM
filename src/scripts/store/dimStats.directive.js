import angular from 'angular';

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
    template: [
      '<div class="stat-bars">',
      '  <div class="stat" title="{{stat.tooltip}}" ng-repeat="stat in vm.statList track by stat.name">',
      '    <img ng-src="{{::stat.icon}}">',
      '    <div class="bar" ng-repeat="n in stat.tiers track by $index">',
      '      <div class="progress" ng-class="{complete: (n / 60) === 1 }" dim-percent-width="n / 60"></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };
}


function StatsCtrl($scope, $translate) {
  var vm = this;

  $scope.$watch('vm.stats', () => {
    if (!vm.stats) {
      vm.statList = [];
      return;
    }

    vm.statList = [vm.stats.STAT_INTELLECT, vm.stats.STAT_DISCIPLINE, vm.stats.STAT_STRENGTH];
    vm.statList.forEach(function(stat) {
      // compute tooltip
      var tier = stat.tier;
      var next = $translate.instant('Stats.TierProgress', { progress: tier === 5 ? stat.value : (stat.value % 60), tier: tier, nextTier: tier + 1, statName: stat.name });
      var cooldown = stat.cooldown || '';
      if (cooldown) {
        cooldown = $translate.instant('Cooldown.' + stat.effect, { cooldown: cooldown });
      }
      stat.tooltip = next + cooldown;
    });
  });
}
