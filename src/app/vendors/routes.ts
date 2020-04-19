import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.vendors.**',
    url: '/vendors?characterId',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "vendors" */ './Vendors');
      return {
        states: [
          {
            name: 'destiny2.vendors',
            url: '/vendors?characterId',
            component: module.default
          }
        ]
      };
    }
  },
  {
    name: 'destiny2.vendor.**',
    url: '/vendor/:id?characterId',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "single-vendor" */ './SingleVendor');
      return {
        states: [
          {
            name: 'destiny2.vendor',
            url: '/vendor/:id?characterId',
            component: module.default
          }
        ]
      };
    }
  }
];
