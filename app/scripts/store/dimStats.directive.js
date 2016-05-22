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
        stats: '=',
      },
      template: [
        '<div class="stats">',
        '  <div class="stat" title="{{vm.formatTooltip(\'STAT_INTELLECT\')}}">',
        '    <img src="images/intellect.png">',
        '    <div class="bar" ng-repeat="n in vm.stats.STAT_INTELLECT.tiers track by $index">',
        '      <div class="progress" ng-class="{complete: (n / 60) === 1 }" dim-percent-width="n / 60"></div>',
        '    </div>',
        '  </div>',
        '  <div class="stat" title="{{vm.formatTooltip(\'STAT_DISCIPLINE\')}}">',
        '    <img src="images/discipline.png">',
        '    <div class="bar" ng-repeat="n in vm.stats.STAT_DISCIPLINE.tiers track by $index">',
        '      <div class="progress" ng-class="{complete: (n / 60) === 1 }" dim-percent-width="n / 60"></div>',
        '    </div>',
        '  </div>',
        '  <div class="stat" title="{{vm.formatTooltip(\'STAT_STRENGTH\')}}">',
        '    <img src="images/strength.png">',
        '    <div class="bar" ng-repeat="n in vm.stats.STAT_STRENGTH.tiers track by $index">',
        '      <div class="progress" ng-class="{complete: (n / 60) === 1 }" dim-percent-width="n / 60"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StatsCtrl.$inject = ['$scope'];

  function StatsCtrl($scope) {
    var vm = this;

    vm.formatTooltip = function(which) {
      var next = ' (' + vm.stats[which].value + '/300)',
          tier = vm.stats[which].tier,
          cooldown = vm.stats[which].cooldown || '';
      if(tier !== 5) {
        next = ' (' + (vm.stats[which].value%60) + '/60 for T' + (tier+1) + ')';
      }
      if(cooldown) {
        cooldown = '\n' + vm.stats[which].effect + ' cooldown: ' + cooldown;
      }
      return 'T' + tier + ' ' + vm.stats[which].name + next + cooldown;
    };
  }
})();
