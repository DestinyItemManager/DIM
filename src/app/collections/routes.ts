import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.collections.**',
    url: '/collections',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "collections" */ './Collections');
      return {
        states: [
          {
            name: 'destiny2.collections',
            url: '/collections?{presentationNodeHash:int}',
            component: module.default
          }
        ]
      };
    }
  }
];
