import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.loadoutbuilder.**',
    lazyLoad: async () => {
      // tslint:disable-next-line:space-in-parens
      const module = await import(/* webpackChunkName: "loadoutBuilder" */ './LoadoutBuilder');
      return {
        states: [
          {
            name: 'destiny2.loadoutbuilder',
            url: '/loadoutbuilder',
            component: module.default
          }
        ]
      };
    }
  }
];
