import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'about.**',
    url: '/about',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "about" */ './About');
      return {
        states: [
          {
            name: 'about',
            url: '/about',
            component: module.default
          }
        ]
      };
    }
  },
  {
    name: 'privacy.**',
    url: '/privacy',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "privacy" */ './Privacy');
      return {
        states: [
          {
            name: 'privacy',
            url: '/privacy',
            component: module.default
          }
        ]
      };
    }
  }
];
