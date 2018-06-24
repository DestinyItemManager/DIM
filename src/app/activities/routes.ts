import { ReactStateDeclaration } from "@uirouter/react";
import { angular2react } from "angular2react";
import { lazyInjector } from "../../lazyInjector";
import { ActivitiesComponent } from "./activities.component";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny1.activities',
  url: '/activities',
  component: angular2react('activities', ActivitiesComponent, lazyInjector.$injector as angular.auto.IInjectorService)
}];
