import { module } from 'angular';
import { StateService, TransitionService, StateParams } from '@uirouter/angularjs';
import { IDialogService } from 'ng-dialog';

/**
 * More ngimports (following the ngimport pattern from https://github.com/bcherny/ngimport).
 *
 * This allows us to break out of the old-style Angular DI and make normal JS modules. As usual,
 * these references will be invalid until Angular bootstraps.
 */

 // ngToaster
export let toaster: any;
export let $state: StateService;
export let $transitions: TransitionService;
export let ngDialog: IDialogService;
export let hotkeys: any;
export let $stateParams: StateParams;
export let loadingTracker: {
  active: boolean;
  addPromise(PromiseLike): void;
};

// prevent double-loading, which has the potential
// to prevent sharing state between services
export default module('dim/ngimport', [])
  .run(['$injector', ($i: angular.auto.IInjectorService) => {
    toaster = $i.get('toaster');
    $state = $i.get('$state');
    $transitions = $i.get('$transitions');
    $stateParams = $i.get('$stateParams');
    loadingTracker = $i.get('loadingTracker');
    ngDialog = $i.get('ngDialog');
    hotkeys = $i.get('hotkeys');
  }])
  .name;
