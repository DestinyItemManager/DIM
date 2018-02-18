import * as angular from 'angular';
import { StateService } from '@uirouter/angularjs';

/**
 * More ngimports (following the ngimport pattern from https://github.com/bcherny/ngimport).
 *
 * This allows us to break out of the old-style Angular DI and make normal JS modules. As usual,
 * these references will be invalid until Angular bootstraps.
 */

 // ngToaster
export let toaster: any;
export let $state: StateService;

// prevent double-loading, which has the potential
// to prevent sharing state between services
export default angular.module('dim/ngimport', [])
  .run(['$injector', ($i: angular.auto.IInjectorService) => {
    toaster = $i.get('toaster');
    $state = $i.get('$state');
  }])
  .name;
