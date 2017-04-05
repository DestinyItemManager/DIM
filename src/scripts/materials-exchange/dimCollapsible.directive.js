import angular from 'angular';

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
    template: `<div class="collapsible-section">
    <div class="title">
      <span class="heading" translate="{{vm.title}}"></span>
      <span>
          <i ng-click="vm.toggleCollapsed()" class="fa collapse fa-minus-square-o" ng-class="vm.collapsed ? 'fa-plus-square-o': 'fa-minus-square-o'"></i>
              </span>
    </div>
    <div ng-hide="vm.collapsed" class="materials-cell">
              <ng-transclude></ng-transclude>
          </div>
  </div>`
  };
}

function SectionCtrl() {
  var vm = this;

  vm.collapsed = vm.isCollapsed || false;
  vm.toggleCollapsed = function(){
    vm.collapsed = !vm.collapsed;
  };
}
