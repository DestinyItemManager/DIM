(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveAmount', MoveAmount);

  MoveAmount.$inject = ['$timeout'];

  function MoveAmount($timeout) {
    return {
      controller: MoveAmountController,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'E',
      scope: {
        amount: '=amount',
        maximum: '=maximum'
      },
      replace: true,
      template: `
        <div class="move-amount">
          <span class="move-amount-arrow" tabindex="-1" ng-click="vm.decrement()">&#9664;</span>
          <input ng-model="vm.amount" type="text" ng-blur="vm.constrain()"/>
          <div class="move-amount-slider">
            <rzslider rz-slider-model="vm.amount" rz-slider-options="{ floor: 1, ceil: vm.maximum, showSelectionBar: true, hideLimitLabels: true }"></rzslider>
          </div>
          <span class="move-amount-arrow" tabindex="-1" ng-click="vm.increment()">&#9654;</span>
        </div>`,
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

  MoveAmountController.$inject = [];

  function MoveAmountController() {
    var vm = this;

    vm.increment = function() {
      vm.amount = Math.min(vm.amount + 1, vm.maximum);
    };

    vm.decrement = function() {
      vm.amount = Math.max(vm.amount - 1, 1);
    };

    vm.constrain = function() {
      var value = parseInt(vm.amount, 10);
      if (isNaN(value)) {
        value = vm.maximum;
      }
      vm.amount = Math.max(1, Math.min(value, vm.maximum));
    };
  }
})();
