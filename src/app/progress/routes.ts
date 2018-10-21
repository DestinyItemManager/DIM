import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.progress.**',
    url: '/progress',
    lazyLoad: async () => {
      // tslint:disable-next-line:space-in-parens
      const module = await import(/* webpackChunkName: "progress" */ './Progress');
      return {
        states: [
          {
            name: 'destiny2.progress',
            url: '/progress',
            component: module.default
          }
        ]
      };
    }
  }
];
