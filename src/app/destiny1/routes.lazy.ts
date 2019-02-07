import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.**',
    url: '/:membershipId-{platformType:int}/d1',
    async lazyLoad() {
      const states = await import(/* webpackChunkName: "destiny1" */ './routes');
      return { states: states.states };
    }
  }
];
