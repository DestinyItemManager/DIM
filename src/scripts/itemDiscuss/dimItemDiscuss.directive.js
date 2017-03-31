import angular from 'angular';
import _ from 'underscore';

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

function ItemDiscussCtrl($scope, $rootScope, toaster, dimItemDiscussService, dimItemService, dimFeatureFlags, $translate) {
  var vm = this;
  vm.featureFlags = dimFeatureFlags;
  vm.show = dimItemDiscussService.dialogOpen;

  $scope.$on('dim-store-item-discuss', function(event, args) {
    console.log("Received discuss event.");
    vm.show = true;
    dimItemDiscussService.dialogOpen = true;

    vm.add(args);
  });
}