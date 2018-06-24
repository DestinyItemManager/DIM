import { ReactStateDeclaration } from "@uirouter/react";
import { PageComponent } from "./page.component";
import { lazyInjector } from "../../lazyInjector";
import { angular2react } from "angular2react";
// tslint:disable-next-line:no-implicit-dependencies
import aboutTemplate from 'app/views/about.html';
// tslint:disable-next-line:no-implicit-dependencies
import supportTemplate from 'app/views/support.html';

const Page = angular2react('dimPage', PageComponent, lazyInjector.$injector as angular.auto.IInjectorService);

export const states: ReactStateDeclaration[] = [{
  name: 'about',
  resolve: {
    src: () => aboutTemplate
  },
  component: Page,
  url: '/about'
}, {
  name: 'support',
  resolve: {
    src: () => supportTemplate
  },
  component: Page,
  url: '/backers'
}];
