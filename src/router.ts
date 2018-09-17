import { UIRouterReact } from '@uirouter/react';

/** The global router for the app, accessible to other parts of the app once initialized. */
export let router: UIRouterReact;

/** This module exists to break a cyclic dependency, so it gets its value set externally. */
export function setRouter(r: UIRouterReact) {
  router = r;
}
