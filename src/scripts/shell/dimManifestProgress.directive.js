import angular from 'angular';

/**
 * A dialog that shows the progress of loading the manifest.
 */
angular.module('dimApp')
  .component('dimManifestProgress', {
    template: [
      '<div class="manifest-progress" ng-if="!$ctrl.manifest.isLoaded || $ctrl.manifest.isError">',
      '  <i ng-if="!$ctrl.manifest.isError" class="fa fa-spin fa-refresh"></i>',
      '  <div>{{$ctrl.manifest.statusText}}</div>',
      '</div>'
    ].join(''),
    controller: ManifestProgressCtrl
  });

function ManifestProgressCtrl(dimManifestService) {
  this.manifest = dimManifestService;
}

