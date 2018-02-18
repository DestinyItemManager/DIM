import { module } from 'angular';
import { D1ManifestService, D2ManifestService } from '../services/manifest-service';
import template from './dimManifestProgress.directive.html';
import './dimManifestProgress.scss';

/**
 * A dialog that shows the progress of loading the manifest.
 */
module('dimApp')
  .component('dimManifestProgress', {
    template,
    controller: ManifestProgressCtrl,
    bindings: {
      destinyVersion: '<'
    }
  });

function ManifestProgressCtrl() {
  this.manifest = this.destinyVersion === 2 ? D2ManifestService : D1ManifestService;
}
