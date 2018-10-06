import { ReactStateDeclaration } from '@uirouter/react';
import LoadoutBuilder from './LoadoutBuilder';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.loadoutbuilder',
    component: LoadoutBuilder,
    url: '/loadoutbuilder'
  }
];
