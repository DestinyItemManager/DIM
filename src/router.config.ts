import { UIRouterReact, servicesPlugin, hashLocationPlugin } from '@uirouter/react';
import { Ng1LocationServices } from '@uirouter/angularjs/lib-esm/locationServices';
import routes from './app/shell/routes';
import { $locationProvider } from './app/ngimport-more';
import { $rootScope, $location, $injector } from 'ngimport';


export default function makeRouter() {
  // Create a new instance of the Router
  const router = new UIRouterReact();
  console.log("ROUTER", router);
  router.plugin(servicesPlugin);
  router.plugin(hashLocationPlugin);

  // Real ugly hacks to make AngularJS play nice with hashchange outside AngularJS.
  router.locationService = new Ng1LocationServices($locationProvider);
  (router.locationService as any)._runtimeServices($rootScope, $location, $injector.get('$sniffer'), $injector.get('$browser'));

  // Lazy load visualizer
  //if ($featureFlags.debugRouter) {
  import('@uirouter/visualizer').then((module) => router.plugin(module.Visualizer));
  //}

  // Register the initial (eagerly loaded) states
  routes.forEach((state) => router.stateRegistry.register(state));

  // Global config for router
  router.urlService.rules.initial({ state: 'default-account' });
  router.urlService.rules.otherwise({ state: 'default-account' });

  router.trace.enable('TRANSITION', 'UIVIEW', 'VIEWCONFIG');

  // Register the "requires auth" hook with the TransitionsService
  //import reqAuthHook from './global/requiresAuth.hook';
  //router.transitionService.onBefore(reqAuthHook.criteria, reqAuthHook.callback, {priority: 10});

  //import googleAnalyticsHook from './util/ga';
  //googleAnalyticsHook(router.transitionService);
  return router;
}