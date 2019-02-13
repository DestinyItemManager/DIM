import { module, ILocationProvider } from 'angular';

/**
 * More ngimports (following the ngimport pattern from https://github.com/bcherny/ngimport).
 *
 * This allows us to break out of the old-style Angular DI and make normal JS modules. As usual,
 * these references will be invalid until Angular bootstraps.
 */

export let $locationProvider: ILocationProvider;

// prevent double-loading, which has the potential
// to prevent sharing state between services
export default module('dim/ngimport', []).config([
  '$locationProvider',
  ($lp) => {
    $locationProvider = $lp;
  }
]).name;
