import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.collections.**',
    lazyLoad: async () => {
      // tslint:disable-next-line:space-in-parens
      const module = await import(/* webpackChunkName: "collections" */ './Collections');
      return {
        states: [
          {
            name: 'destiny2.collections',
            url: '/collections',
            component: module.default
          }
        ]
      };
    }
  }
];
