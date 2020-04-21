import { ReactStateDeclaration } from '@uirouter/react';
import Privacy from './Privacy';

export const states: ReactStateDeclaration[] = [
  {
    name: 'privacy',
    component: Privacy,
    url: '/privacy'
  }
];
