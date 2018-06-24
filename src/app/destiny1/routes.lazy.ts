import { ReactStateDeclaration } from "@uirouter/react";
import { $injector } from "ngimport";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny1.**',
  parent: 'destiny-account',
  async lazyLoad() {
    const $ocLazyLoad = $injector.get('$ocLazyLoad') as any;
    // tslint:disable-next-line:space-in-parens
    const mod = await import(/* webpackChunkName: "destiny1" */ '../destiny1/destiny1.module');
    console.log("MOD", mod);
    $ocLazyLoad.load(mod.angularModule);
    return { states: mod.states };
  }
}];
