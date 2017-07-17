import _ from 'underscore';
import template from './dimItemTag.directive.html';

export const ItemTagComponent = {
  controller: ItemTagController,
  bindings: {
    item: '='
  },
  template: template
};

function ItemTagController($scope, $rootScope, dimSettingsService) {
  'ngInject';
  const vm = this;

  vm.settings = dimSettingsService;
  $scope.$watch('$ctrl.item.dimInfo.tag', () => {
    if (vm.item.dimInfo) {
      vm.selected = _.find(vm.settings.itemTags, (tag) => {
        return tag.type === vm.item.dimInfo.tag;
      });
    }
  });

  vm.updateTag = function() {
    vm.item.dimInfo.tag = vm.selected.type;
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save();
  };

  $scope.$on('dim-item-tag', (e, args) => {
    if (vm.item.dimInfo.tag === args.tag) {
      delete vm.item.dimInfo.tag;
    } else {
      vm.item.dimInfo.tag = args.tag;
    }
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save();
  });
}
