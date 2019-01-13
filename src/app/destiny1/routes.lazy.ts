import { ReactStateDeclaration } from '@uirouter/react';
import { $injector } from 'ngimport';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.**',
    url: '/:membershipId-{platformType:int}/d1',
    async lazyLoad() {
      const $ocLazyLoad = $injector.get('$ocLazyLoad') as any;
      const mod = await import(/* webpackChunkName: "destiny1" */ './destiny1.module');
      $ocLazyLoad.load(mod.angularModule);
      return { states: mod.states };
    }
  }
];
