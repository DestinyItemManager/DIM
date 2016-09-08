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
        stats: '='
      },
      template: [
        '<div class="stat-bars">',
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

  StatsCtrl.$inject = ['$filter'];

  function StatsCtrl($filter) {
    var vm = this;

    _.each(vm.stats, function(stat) {
      stat.normalized = stat.value > 300 ? 300 : stat.value;
      stat.tier = Math.floor(stat.normalized / 60);
      stat.tiers = [];
      stat.remaining = stat.value;
      for (var t = 0; t < 5; t++) {
        stat.remaining -= stat.tiers[t] = stat.remaining > 60 ? 60 : stat.remaining;
      }
      stat.percentage = (100 * stat.normalized / 300).toFixed();
    });

    vm.formatTooltip = function(which) {
      var next = ' (' + vm.stats[which].value + '/300)';
      var tier = vm.stats[which].tier;
      var cooldown = vm.stats[which].cooldown || '';
      if (tier !== 5) {
        next = ' (' + $filter('translate')('tier_progress', { progress: (vm.stats[which].value % 60) + "/60", tier: 'T' + (tier + 1) }) + ')';
      }
      if (cooldown) {
        cooldown = '\n' + $filter('translate')(vm.stats[which].effect + '_cooldown') + ": " + cooldown;
      }
      return 'T' + tier + ' ' + vm.stats[which].name + next + cooldown;
    };
  }
})();
