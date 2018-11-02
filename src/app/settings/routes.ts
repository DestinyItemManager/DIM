import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings.**',
    url: '/settings',
    lazyLoad: () =>
      import(// tslint:disable-next-line:space-in-parens
      /* webpackChunkName: "settings" */ './routes.lazy')
  }
];
