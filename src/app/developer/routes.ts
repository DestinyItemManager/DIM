import { ReactStateDeclaration } from '@uirouter/react';
import { DeveloperComponent } from './developer.component';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';
import ComponentPlayground from './ComponentPlayground';

export const states: ReactStateDeclaration[] = [
  {
    name: 'developer',
    url: '/developer',
    component: angular2react(
      'dimDeveloper',
      DeveloperComponent,
      lazyInjector.$injector as angular.auto.IInjectorService
    )
  },
  {
    name: 'components',
    url: '/components',
    component: ComponentPlayground
  }
];
