import { module, ILocationProvider } from 'angular';
import { IDialogService } from 'ng-dialog';
import { HotkeysProvider } from 'angular-hotkeys';

/**
 * More ngimports (following the ngimport pattern from https://github.com/bcherny/ngimport).
 *
 * This allows us to break out of the old-style Angular DI and make normal JS modules. As usual,
 * these references will be invalid until Angular bootstraps.
 */

// ngToaster
export let toaster: any;
export let ngDialog: IDialogService;
export let hotkeys: HotkeysProvider;
export let $locationProvider: ILocationProvider;
export let loadingTracker: {
  active(): boolean;
  addPromise(PromiseLike): void;
};

// prevent double-loading, which has the potential
// to prevent sharing state between services
export default module('dim/ngimport', [])
  .run([
    '$injector',
    ($i: angular.auto.IInjectorService) => {
      toaster = $i.get('toaster');
      loadingTracker = $i.get('loadingTracker');
      ngDialog = $i.get('ngDialog');
      hotkeys = $i.get('hotkeys');
    }
  ])
  .config([
    '$locationProvider',
    ($lp) => {
      $locationProvider = $lp;
    }
  ]).name;
