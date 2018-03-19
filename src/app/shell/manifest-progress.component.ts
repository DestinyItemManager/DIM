import { D1ManifestService, D2ManifestService } from '../manifest/manifest-service';
import template from './dimManifestProgress.directive.html';
import './dimManifestProgress.scss';
import { IComponentOptions } from 'angular';

/**
 * A dialog that shows the progress of loading the manifest.
 */
export const ManifestProgressComponent: IComponentOptions = {
  template,
  controller: ManifestProgressCtrl,
  bindings: {
    destinyVersion: '<'
  }
};

function ManifestProgressCtrl() {
  this.manifest = this.destinyVersion === 2 ? D2ManifestService : D1ManifestService;
}
