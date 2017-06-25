import angular from 'angular';
import template from './dimMoveAmount.directive.html';

angular.module('dimApp')
  .directive('dimMoveAmount', MoveAmount);

function MoveAmount($timeout) {
  return {
    controller: MoveAmountController,
    controllerAs: 'vm',
    bindToController: true,
    restrict: 'E',
    scope: {
      amount: '=amount',
      maximum: '=maximum',
      maxStackSize: '=maxStackSize'
    },
    replace: true,
    template: template,
    link: function(scope, element) {
      $timeout(() => {
        scope.$broadcast('rzSliderForceRender');
        const input = element.find('input');
        input.focus();
        input.get(0).setSelectionRange(0, input.get(0).value.length);
      });
    }
  };
}


function MoveAmountController() {
  const vm = this;

  vm.increment = function() {
    vm.amount = Math.min(vm.amount + 1, vm.maximum);
  };

  vm.max = function() {
    vm.amount = vm.maximum;
  };

  vm.min = function() {
    vm.amount = 1;
  };

  vm.decrement = function() {
    vm.amount = Math.max(vm.amount - 1, 1);
  };

  vm.upstack = function() {
    vm.amount = Math.min(vm.maximum, (Math.floor(vm.amount / vm.maxStackSize) * vm.maxStackSize) + vm.maxStackSize);
  };

  vm.downstack = function() {
    vm.amount = Math.max(1, (Math.ceil(vm.amount / vm.maxStackSize) * vm.maxStackSize) - vm.maxStackSize);
  };

  vm.constrain = function() {
    let value = parseInt(vm.amount, 10);
    if (isNaN(value)) {
      value = vm.maximum;
    }
    vm.amount = Math.max(1, Math.min(value, vm.maximum));
  };
}
