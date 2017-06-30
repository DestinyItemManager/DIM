import template from './dimCollapsible.directive.html';

export function Section() {
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
  const vm = this;

  vm.collapsed = vm.isCollapsed || false;
  vm.toggleCollapsed = function(){
    vm.collapsed = !vm.collapsed;
  };
}
