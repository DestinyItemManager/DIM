import angular from 'angular';

angular.module('dimApp')
  .directive('dimItemDiscuss', ItemDiscuss);

function ItemDiscuss() {
  return {
    controller: ItemDiscussCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    templateUrl: require('./dimItemDiscuss.directive.template.html')
  };
}

function ItemDiscussCtrl($scope, $rootScope, toaster, dimItemDiscussService, dimItemService, dimFeatureFlags) {
  var vm = this;
  vm.featureFlags = dimFeatureFlags;
  vm.show = dimItemDiscussService.dialogOpen;
  vm.dtrRatingOptions = [1, 2, 3, 4, 5];

  $rootScope.$on('dim-store-item-discuss', function(event, item) {
    vm.show = true;

    vm.item = item.item;
  });

  vm.cancel = function cancel() {
    vm.loadout = angular.copy(vm.defaults);
    dimItemDiscussService.dialogOpen = false;
    vm.show = false;
  };
}