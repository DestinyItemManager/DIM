(function() {
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
                '<div ng-class="vm.classes">',
                '  <div class="thumb" style="background-image: url({{vm.item.icon}})"></div>',
                '  <span ng-show="vm.item.locked" class="locked"></span>',
                '  <div class="elemental" ng-show="vm.isElemental"></div>',
                '  <span><a target="_blank" href="http://db.planetdestiny.com/items/view/{{vm.item.hash}}">{{vm.title}}</a></span>',
                '  <span ng-show="vm.light > 0"> &#10022; {{ vm.light }}</span>',
                '</div>'
            ].join('')
        };
    }

    MoveItemPropertiesCtrl.$inject = ['$sce'];

    function MoveItemPropertiesCtrl($sce) {
        var vm = this;

        vm.isElemental = false;

        vm.classes = {
            'item-name': true,
            'panel-heading': true,
            'is-arc': false,
            'is-solar': false,
            'is-void': false
        };

        vm.title = $sce.trustAsHtml(vm.item.name);
        vm.light = 0;
        vm.stats = [];

        if (vm.item.primStat) {
            if (vm.item.primStat.statHash === 3897883278) {
                // only 4 stats if there is a light element. other armor has only 3 stats.
                if (vm.item.stats.length === 4) {
                    vm.light = vm.item.stats[0].value;
                }

                var stats = ['Int', 'Dis', 'Str'];
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
                switch (vm.item.dmg) {
                    case 'arc':
                        {
                            vm.classes['is-arc'] = true;
                            vm.isElemental = true;
                            break;
                        }
                    case 'solar':
                        {
                            vm.classes['is-solar'] = true;
                            vm.isElemental = true;
                            break;
                        }
                    case 'void':
                        {
                            vm.classes['is-void'] = true;
                            vm.isElemental = true;
                            break;
                        }
                }

                vm.stats.push({
                    'label': 'Attack',
                    'value': vm.item.primStat.value
                });
            }
        }
    }
})();
