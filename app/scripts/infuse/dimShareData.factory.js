(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimShareData', shareDataService);

  shareDataService.$inject = []

  function shareDataService() {

    var shareDataService = this;
    var item = null;

    return {
      getItem: function() {
        return shareDataService.item;
      },
      setItem: function(item) {
        shareDataService.item = item;
      }
    }

  }

})();
