import { ReactStateDeclaration } from '@uirouter/react';
import About from './About';

export const states: ReactStateDeclaration[] = [
  {
    name: 'about',
    component: About,
    url: '/about'
  }
];
