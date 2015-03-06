(function () {
  'use strict';

  angular.module('dimApp').directive('dimStorage', Storage);

  function Storage() {
    return {
      bindToController: true,
      controller: StorageCtrl,
      controllerAs: 'storeVM',
      link: Link,
      scope: {
        'item': '=dimStorage'
      },
      template: [
        '<div dim-character="storeVM.item"></div>'].join('')
    };

    function StorageCtrl($scope, $window) {
      var self = this;

      //self.storage = $window._storage;

      // $scope.$watch(function windowWatchFunction() {
      //   return _.pairs($window._storage).length;
      // }, function storageWatch(newVal, oldVal) {
      //   self.storage = _.pairs($window._storage);
      // });
    }

    function Link(scope, element, attr) {
      element.addClass('storage');
    }
  }
})();
