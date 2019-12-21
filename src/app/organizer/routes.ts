import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.organizer.**',
    url: '/organizer',
    lazyLoad: async () => {
      const module = await import(/* webpackChunkName: "organizer" */ './Organizer');
      return {
        states: [
          {
            name: 'destiny2.organizer',
            url: '/organizer',
            component: module.default
          }
        ]
      };
    }
  }
];
