import angular from 'angular';
import template from './dimSimpleItem.directive.html';

angular.module('dimApp')
  .directive('dimSimpleItem', dimItem);

function dimItem() {
  return {
    replace: true,
    scope: {
      item: '=itemData'
    },
    restrict: 'E',
    template: template,
    bindToController: true,
    controllerAs: 'vm',
    controller: dimItemSimpleCtrl
  };
}


function dimItemSimpleCtrl() {
  // nothing to do here...only needed for bindToController
}
