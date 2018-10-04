import { ReactStateDeclaration } from '@uirouter/react';
import LoadoutBuilder from './LoadoutBuilder';

export const states: ReactStateDeclaration[] = $featureFlags.d2LoadoutBuilder
  ? [
      {
        name: 'destiny2.loadoutbuilder',
        component: LoadoutBuilder,
        url: '/loadoutbuilder'
      }
    ]
  : [];
