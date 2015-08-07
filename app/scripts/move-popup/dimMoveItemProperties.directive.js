(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties);

  MoveItemProperties.$inject = ['$sce'];

  function MoveItemProperties($sce) {
    return {
      bindToController: true,
      controller: MoveItemPropertiesCtrl,
      controllerAs: 'vm',
      scope: {
        item: '=dimMoveItemProperties'
      },
      restrict: 'A',
      replace: true,
      template: [
        '<div>',
        '<div ng-class="vm.classes">',
        '  <span ng-show="vm.item.locked" class="locked"></span>',
        '  <span><a target="_new" href="http://db.destinytracker.com/inventory/item/{{vm.item.hash}}">{{vm.title}}</a></span>',
        '  <span ng-show="vm.light > 0"> &#10022; {{ vm.light }}</span>',
        '  <span ng-repeat="stat in vm.stats track by stat"> | {{ stat.label }} {{ stat.value }}</span>',
        '  <span class="pull-right" ng-mouseover="itemdetails = true;" ng-show="!itemdetails">Show Details</span>',
        '</div>',
        '<div class="item-details" ng-show="itemdetails">',
        '  <div class="item-stats" ng-repeat="stat in vm.item.stats track by $index">',
        '    <div class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer">',
        '         <span ng-show="{{ stat.bar }}" class="stat-box-inner" style="width: {{ stat.value * 2 }}px">{{ stat.value }}</span>',
        '         <span ng-hide="{{ stat.bar }}">{{ stat.value }}</span>',
        '       </span>',
        '    </div>',
        '  </div>',
        '  <div class="item-perks">',
        '    <div ng-repeat="perk in vm.item.perks track by $index" style="background-image: url(http://bungie.net{{ perk.iconPath }})"></div>',
        '  </div>',
        '</div>',
        '</div>'
      ].join('')
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', 'dimSettingsService'];

  function MoveItemPropertiesCtrl($sce, settings) {
    var vm = this;

    vm.classes = {
      'item-name': true,
      'is-arc': false,
      'is-solar': false,
      'is-void': false
    };

    vm.title = $sce.trustAsHtml(vm.item.name);
    vm.light = 0;
    vm.stats = [];
    vm.itemDetails = true;
    settings.getSetting('itemDetails')
          .then(function(show) {
            vm.itemDetails = show;
          });

    if (vm.item.primStat) {
      if (vm.item.primStat.statHash === 3897883278) {
        // only 4 stats if there is a light element. other armor has only 3 stats.
        if (vm.item.stats.length === 4) {
          vm.light = vm.item.stats[0].value;
        }

        var stats = ['Int:', 'Dis:', 'Str:'];
        var val = 0;

        for (var s = 0; s < stats.length; s++) {
          val = vm.item.stats[s + (vm.item.stats.length === 4 ? 1 : 0)].value;
          if (val !== 0) {
            vm.stats.push({
              'label': stats[s],
              'value': val
            });
          }
        }
      } else if (vm.item.primStat.statHash === 368428387) {
        // switch(vm.item.dmg) {
        // 	case 'arc': vm.color = '#85c5ec'; break;
        // 	case 'solar': vm.color = '#f2721b';  break;
        // 	case 'void': vm.color = '#b184c5'; break;
        // }

        switch (vm.item.dmg) {
        case 'arc':
          {
            vm.classes['is-arc'] = true;
            break;
          }
        case 'solar':
          {
            vm.classes['is-solar'] = true;
            break;
          }
        case 'void':
          {
            vm.classes['is-void'] = true;
            break;
          }
        }

        vm.stats.push({
          'label': 'Atk:',
          'value': vm.item.primStat.value
        });        
      }
    }
  }
})();
