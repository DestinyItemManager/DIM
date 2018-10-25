import { ReactStateDeclaration } from '@uirouter/react';
import DiagnosticsPage from './DiagnosticsPage';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings.**',
    url: '/settings',
    lazyLoad: () =>
      import(// tslint:disable-next-line:space-in-parens
      /* webpackChunkName: "settings" */ './routes.lazy')
  },
  {
    name: 'diagnostics',
    url: '/diagnostics',
    component: DiagnosticsPage
  }
];
