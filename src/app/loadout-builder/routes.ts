import { ReactStateDeclaration } from '@uirouter/react';
import D1LoadoutBuilder from './D1LoadoutBuilder';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.loadout-builder',
    component: D1LoadoutBuilder,
    url: '/loadout-builder'
  }
];
