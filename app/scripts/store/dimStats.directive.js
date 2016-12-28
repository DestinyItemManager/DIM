(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStats', Stats);

  Stats.$inject = [];

  function Stats() {
    return {
      controller: StatsCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        stats: '<'
      },
      templateUrl: 'scripts/store/dimStats.directive.html'
    };
  }

  StatsCtrl.$inject = ['$scope', '$translate'];

  function StatsCtrl($scope, $translate) {
    var vm = this;

    $scope.$watch('vm.stats', () => {
      vm.statList = [vm.stats.STAT_INTELLECT, vm.stats.STAT_DISCIPLINE, vm.stats.STAT_STRENGTH];
      vm.statList.forEach(function(stat) {
        // compute tooltip
        var next = ' (' + stat.value + '/300)';
        var tier = stat.tier;
        var cooldown = stat.cooldown || '';
        if (tier !== 5) {
          next = ' (' + $translate.instant('Stats.TierProgress', { progress: (stat.value % 60) + "/60", tier: 'T' + (tier + 1) }) + ')';
        }
        if (cooldown) {
          cooldown = '\n' + $translate.instant('Cooldown.' + stat.effect) + ": " + cooldown;
        }
        stat.tooltip = 'T' + tier + ' ' + stat.name + next + cooldown;
      });
    });
  }
})();
