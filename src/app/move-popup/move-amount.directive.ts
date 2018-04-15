import template from './move-amount.html';
import './move-amount.scss';
import { IDirective, IController } from 'angular';

export function MoveAmount($timeout): IDirective {
  'ngInject';
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
    template,
    link(scope, element) {
      $timeout(() => {
        scope.$broadcast('rzSliderForceRender');
        const input = element[0].getElementsByTagName('input')[0];
        input.focus();
        input.setSelectionRange(0, input.value.length);
      });
    }
  };
}

function MoveAmountController(this: IController) {
  const vm = this;

  vm.increment = () => {
    vm.amount = Math.min(vm.amount + 1, vm.maximum);
  };

  vm.max = () => {
    vm.amount = vm.maximum;
  };

  vm.min = () => {
    vm.amount = 1;
  };

  vm.decrement = () => {
    vm.amount = Math.max(vm.amount - 1, 1);
  };

  vm.upstack = () => {
    vm.amount = Math.min(vm.maximum, (Math.floor(vm.amount / vm.maxStackSize) * vm.maxStackSize) + vm.maxStackSize);
  };

  vm.downstack = () => {
    vm.amount = Math.max(1, (Math.ceil(vm.amount / vm.maxStackSize) * vm.maxStackSize) - vm.maxStackSize);
  };

  vm.constrain = () => {
    let value = parseInt(vm.amount, 10);
    if (isNaN(value)) {
      value = vm.maximum;
    }
    vm.amount = Math.max(1, Math.min(value, vm.maximum));
  };
}
