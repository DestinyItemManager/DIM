(function() {
  'use strict';

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
      templateUrl: 'scripts/materials-exchange/dimCollapsible.directive.html'
    };
  }

  function SectionCtrl() {
    var vm = this;

    vm.collapsed = vm.isCollapsed || false;
    vm.toggleCollapsed = function(){
      vm.collapsed = !vm.collapsed;
    };
  }
})();
