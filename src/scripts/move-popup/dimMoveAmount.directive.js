import angular from 'angular';

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
    template: [
      '<div>',
      '<div class="move-amount">',
      '  <input ng-model="vm.amount" type="text" ng-blur="vm.constrain()"/>',
      '  <div class="move-amount-slider">',
      '    <rzslider rz-slider-model="vm.amount" rz-slider-options="{ floor: 1, ceil: vm.maximum, showSelectionBar: true, hideLimitLabels: true }"></rzslider>',
      '  </div>',
      '</div>',
      '<div class="move-amount">',
      '  <i class="move-amount-arrow fa fa-fast-backward" tabindex="-1" ng-click="vm.min()" translate-attr="{ title: \'MoveAmount.Min\'}"></i>',
      '  <i class="move-amount-arrow fa fa-step-backward" tabindex="-1" ng-click="vm.downstack()" translate-attr="{ title: \'MoveAmount.DownStack\'}"></i>',
      '  <span class="move-amount-arrow" tabindex="-1" ng-click="vm.decrement()" translate-attr="{ title: \'MoveAmount.Decrement\'}">&#9664;</span>',
      '  <span class="move-amount-arrow" tabindex="-1" ng-click="vm.increment()" translate-attr="{ title: \'MoveAmount.Increment\'}">&#9654;</span>',
      '  <i class="move-amount-arrow fa fa-step-forward" tabindex="-1" ng-click="vm.upstack()" translate-attr="{ title: \'MoveAmount.UpStack\'}"></i>',
      '  <i class="move-amount-arrow fa fa-fast-forward" tabindex="-1" ng-click="vm.max()" translate-attr="{ title: \'MoveAmount.Max\'}"></i>',
      '</div>',
      '</div>'
    ].join(''),
    link: function(scope, element) {
      $timeout(function() {
        scope.$broadcast('rzSliderForceRender');
        var input = element.find('input');
        input.focus();
        input.get(0).setSelectionRange(0, input.get(0).value.length);
      });
    }
  };
}


function MoveAmountController() {
  var vm = this;

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
    var value = parseInt(vm.amount, 10);
    if (isNaN(value)) {
      value = vm.maximum;
    }
    vm.amount = Math.max(1, Math.min(value, vm.maximum));
  };
}
