
export const VendorItem = {
  bindings: {
    saleItem: '<',
    totalCoins: '<',
    itemClicked: '&'
  },
  template: [
    '<div class="vendor-item"',
    '     ng-class="{ \'search-hidden\': !$ctrl.saleItem.item.visible }">',
    '  <div ng-if="!$ctrl.saleItem.unlocked" class="locked-overlay"></div>',
    '  <dim-simple-item item-data="$ctrl.saleItem.item" ng-click="$ctrl.itemClicked({ $event: $event })" ng-class="{ \'search-hidden\': !$ctrl.saleItem.item.visible }"></dim-simple-item>',
    '  <div class="vendor-costs">',
    '    <div ng-repeat="cost in ::$ctrl.saleItem.costs track by cost.currency.itemHash" class="cost" ng-class="{notenough: ($ctrl.totalCoins[saleItem.cost.currency.itemHash] < saleItem.cost.value)}">',
    '      {{::cost.value}}',
    '      <span class="currency"><img ng-src="{{::cost.currency.icon | bungieIcon}}" title="{{::cost.currency.itemName}}"></span>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('')
};