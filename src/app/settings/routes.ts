import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings.**',
    url: '/settings',
    lazyLoad: () => import(/* webpackChunkName: "settings" */ './routes.lazy')
  }
];
