(function() {
  'use strict';

  /**
   * A dialog that shows the progress of loading the manifest.
   */
  angular.module('dimApp')
    .component('dimManifestProgress', {
      templateUrl: 'scripts/shell/dimManifestProgress.directive.html',
      controller: ManifestProgressCtrl
    });

  ManifestProgressCtrl.$inject = ['dimManifestService'];
  function ManifestProgressCtrl(dimManifestService) {
    this.manifest = dimManifestService;
  }
})();
