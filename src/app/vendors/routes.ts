import { ReactStateDeclaration } from "@uirouter/react";
import { angular2react } from "angular2react";
import { lazyInjector } from "../../lazyInjector";
import { VendorsComponent } from "./vendors.component";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny1.vendors',
  component: angular2react('dimVendors', VendorsComponent, lazyInjector.$injector as angular.auto.IInjectorService),
  url: '/vendors'
}];
