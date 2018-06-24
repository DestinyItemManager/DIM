import { destinyAccountResolver } from "../shell/destiny-account.route";
import { ReactStateDeclaration } from "@uirouter/react";
import { D2InventoryComponent } from "./d2-inventory.component";
import { angular2react } from "angular2react";
import { lazyInjector } from "../../lazyInjector";
import Destiny2 from "./Destiny2";

// Root state for Destiny 2 views
export const destiny2State: ReactStateDeclaration = {
  name: 'destiny2',
  parent: 'destiny-account',
  redirectTo: 'destiny2.inventory',
  url: '/d2',
  component: Destiny2,
  resolve: {
    account: destinyAccountResolver(2)
  }
};

export const destiny2InventoryState: ReactStateDeclaration = {
  name: 'destiny2.inventory',
  url: '/inventory',
  component: angular2react('inventory2', D2InventoryComponent, lazyInjector.$injector as angular.auto.IInjectorService)
};
