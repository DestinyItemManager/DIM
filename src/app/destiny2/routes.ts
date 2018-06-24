import { destinyAccountResolver } from "../shell/destiny-account.route";
import { Destiny2Component } from "./destiny2.component";
import { ReactStateDeclaration } from "@uirouter/react";
import { D2InventoryComponent } from "./d2-inventory.component";
import { angular2react } from "angular2react";
import { lazyInjector } from "../../lazyInjector";

// Root state for Destiny 2 views
export const destiny2State: ReactStateDeclaration = {
  name: 'destiny2',
  parent: 'destiny-account',
  redirectTo: 'destiny2.inventory',
  url: '/d2',
  component: angular2react('destiny2', Destiny2Component, lazyInjector.$injector as angular.auto.IInjectorService),
  resolve: {
    account: destinyAccountResolver(2)
  }
};

export const destiny2InventoryState: ReactStateDeclaration = {
  name: 'destiny2.inventory',
  url: '/inventory',
  component: angular2react('inventory2', D2InventoryComponent, lazyInjector.$injector as angular.auto.IInjectorService)
};
