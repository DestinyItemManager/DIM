import { destinyAccountResolver } from "../shell/destiny-account.route";
import { ReactStateDeclaration } from "@uirouter/react";
import Destiny from "../destiny2/Destiny";
import { angular2react } from "angular2react";
import { D1InventoryComponent } from "../destiny1/d1-inventory.component";
import { lazyInjector } from "../../lazyInjector";

// Root state for Destiny 1 views
export const states: ReactStateDeclaration[] = [{
  name: 'destiny1',
  parent: 'destiny-account',
  redirectTo: 'destiny1.inventory',
  url: '/d1',
  component: Destiny,
  resolve: {
    account: destinyAccountResolver(1)
  }
}, {
  name: 'destiny1.inventory',
  url: '/inventory',
  component: angular2react('inventory1', D1InventoryComponent, lazyInjector.$injector as angular.auto.IInjectorService)
}];
