(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimVendorCtrl', dimVendorCtrl);

  dimVendorCtrl.$inject = ['$scope', '$q', 'dimVendorService', 'ngDialog', 'dimStoreService', '$timeout'];

  function dimVendorCtrl($scope, $q, dimVendorService, ngDialog, dimStoreService, $timeout) {
    var vm = this;
    var dialogResult = null;
    var detailItem = null;
    var detailItemElement = null;
    
    $scope.$on('ngDialog.opened', function (event, $dialog) {
      if (dialogResult) {
        $dialog.position({
          my: 'left top',
          at: 'left bottom+4',
          of: detailItemElement,
          collision: 'flip'
        });
      }
    });
    
    dimVendorService.getVendorItems().then(function(val) {
      console.log(val);
    });

  }
})();
