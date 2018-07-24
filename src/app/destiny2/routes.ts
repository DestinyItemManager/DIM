import { destinyAccountResolver } from "../accounts/destiny-account-resolver";
import { ReactStateDeclaration } from "@uirouter/react";
import { D2InventoryComponent } from "./d2-inventory.component";
import { angular2react } from "angular2react";
import { lazyInjector } from "../../lazyInjector";
import Destiny from "../shell/Destiny";

// Root state for Destiny 2 views
export const states: ReactStateDeclaration[] = [{
  name: 'destiny2',
  redirectTo: 'destiny2.inventory',
  url: '/:membershipId-{platformType:int}/d2',
  component: Destiny,
  resolve: {
    account: destinyAccountResolver(2)
  }
}, {
  name: 'destiny2.inventory',
  url: '/inventory',
  component: angular2react('inventory2', D2InventoryComponent, lazyInjector.$injector as angular.auto.IInjectorService)
}];
