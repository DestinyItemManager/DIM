import { ReactStateDeclaration } from '@uirouter/react';
import About from './About';
import Support from './Support';

export const states: ReactStateDeclaration[] = [
  {
    name: 'about',
    component: About,
    url: '/about'
  }
];
