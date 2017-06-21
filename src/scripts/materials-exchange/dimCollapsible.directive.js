import angular from 'angular';
import template from './dimCollapsible.directive.html';

angular.module('dimApp').directive('dimCollapsibleSection', Section);

function Section() {
  return {
    transclude: true,
    scope: {
      title: '@',
      isCollapsed: '@'
    },
    controller: SectionCtrl,
    controllerAs: 'vm',
    bindToController: true,
    template: template
  };
}

function SectionCtrl() {
  var vm = this;

  vm.collapsed = vm.isCollapsed || false;
  vm.toggleCollapsed = function(){
    vm.collapsed = !vm.collapsed;
  };
}
