import { UIRouterReact, servicesPlugin, pushStateLocationPlugin } from '@uirouter/react';
import { states } from './routes';
import { dimNeedsUpdate } from './register-service-worker';
import { reloadDIM } from './whats-new/WhatsNewLink';

export default function makeRouter() {
  const router = new UIRouterReact();
  router.plugin(servicesPlugin);
  router.plugin(pushStateLocationPlugin);

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
  });

  let initialLoad = true;
  // "Sneaky Updates" - update on navigation if DIM needs an update
  router.transitionService.onSuccess({}, () => {
    if (!initialLoad && dimNeedsUpdate) {
      reloadDIM();
    }
    initialLoad = false;
  });

  if ($featureFlags.googleAnalyticsForRouter) {
    router.transitionService.onSuccess({}, (transition) => {
      ga('send', 'pageview', transition.$to().name);
    });
  }

  return router;
}
