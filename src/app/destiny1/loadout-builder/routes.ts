import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.loadout-builder.**',
    url: '/loadout-builder',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "d1LoadoutBuilder" */ './D1LoadoutBuilder');
      return {
        states: [
          {
            name: 'destiny1.loadout-builder',
            url: '/loadout-builder',
            component: module.default
          }
        ]
      };
    }
  }
];
