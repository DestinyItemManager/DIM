(function() {
  'use strict';

  var Perks = {
    bindings: {
      perks: '<'
    },
    template: `<div class="perks">
        <div class="perk" ng-class="{active: perk.active}" ng-repeat="perk in $ctrl.perks track by perk.hash">
          <img class="perk-icon" ng-src="{{::perk.icon | bungieIcon}}"/>
          <div class="perk-info">
            <h3>{{::perk.name}}</h3>
            <p>{{::perk.description}}</p>
          </div>
        </div>
      </div>`
  };

  angular.module('dimApp')
    .component('dimPerks', Perks);
})();
