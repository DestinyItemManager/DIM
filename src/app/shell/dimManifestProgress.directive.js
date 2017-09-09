import angular from 'angular';
import template from './dimManifestProgress.directive.html';
import './dimManifestProgress.scss';

/**
 * A dialog that shows the progress of loading the manifest.
 */
angular.module('dimApp')
  .component('dimManifestProgress', {
    template,
    controller: ManifestProgressCtrl,
    bindings: {
      destinyVersion: '<'
    }
  });

function ManifestProgressCtrl(dimManifestService, D2ManifestService) {
  if (this.destinyVersion === 2) {
    this.manifest = D2ManifestService;
  } else {
    this.manifest = dimManifestService;
  }
}
