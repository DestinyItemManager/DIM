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
}