(function () {
  'use strict';

  angular.module('dimApp')
    .controller('LootCtrl', LootController);

  function LootController($scope, $window) {
    var self = this;

    self.data = $window.dimDO;

    var oldCollection = {};
    $scope.$watchCollection(function() {
      return $window.dimDO;
    }, function (newCollection) {
      self.data = newCollection;
    });
  }
})();
