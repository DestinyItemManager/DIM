import { UIRouterReact, servicesPlugin, hashLocationPlugin } from '@uirouter/react';
import { Ng1LocationServices } from '@uirouter/angularjs/lib-esm/locationServices';
import { states } from './app/routes';
import { $locationProvider } from './app/ngimport-more';
import { $rootScope, $location, $injector } from 'ngimport';

export default function makeRouter() {
  const router = new UIRouterReact();
  router.plugin(servicesPlugin);
  router.plugin(hashLocationPlugin);

  // Real ugly hacks to make AngularJS play nice with hashchange outside AngularJS.
  router.locationService = new Ng1LocationServices($locationProvider);
  (router.locationService as any)._runtimeServices(
    $rootScope,
    $location,
    $injector.get('$sniffer'),
    $injector.get('$browser')
  );

  // Debug visualizer
  if ($featureFlags.debugRouter) {
    // tslint:disable-next-line:no-require-imports
    router.plugin(require('@uirouter/visualizer').Visualizer);
    router.trace.enable('TRANSITION');
  }

  // Register the initial (eagerly loaded) states
  states.forEach((state) => router.stateRegistry.register(state));

  // Global config for router
  router.urlService.rules.initial({ state: 'default-account' });
  router.urlService.rules.otherwise({ state: 'default-account' });

  // Scroll to the top of the page when we switch pages
  router.transitionService.onSuccess({}, () => {
    document.body.scrollTop = 0;
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }

    // TODO: Remove when we remove AngularJS
    $rootScope.$apply();
  });

  if ($featureFlags.googleAnalyticsForRouter) {
    router.transitionService.onSuccess({}, (transition) => {
      ga('send', 'pageview', transition.$to().name);
    });
  }

  return router;
}
