import { ReactStateDeclaration } from '@uirouter/react';
import About from './About';
import Privacy from './Privacy';

export const states: ReactStateDeclaration[] = [
  {
    name: 'about',
    component: About,
    url: '/about'
  },
  {
    name: 'privacy',
    component: Privacy,
    url: '/privacy'
  }
];
