import angular from 'angular';
import template from './dimManifestProgress.directive.html';
/**
 * A dialog that shows the progress of loading the manifest.
 */
angular.module('dimApp')
  .component('dimManifestProgress', {
    template: template,
    controller: ManifestProgressCtrl
  });

function ManifestProgressCtrl(dimManifestService) {
  this.manifest = dimManifestService;
}
