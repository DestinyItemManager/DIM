import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'whats-new.**',
    url: '/whats-new',
    lazyLoad: async () => {
      // tslint:disable-next-line:space-in-parens
      const module = await import(/* webpackChunkName: "whatsNew" */ './WhatsNew');
      return {
        states: [
          {
            name: 'whats-new',
            url: '/whats-new',
            component: module.default
          }
        ]
      };
    }
  }
];
