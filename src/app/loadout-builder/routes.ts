import { ReactStateDeclaration } from '@uirouter/react';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';
import { LoadoutBuilderComponent } from './loadout-builder.component';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.loadout-builder',
    component: angular2react(
      'loadoutBuilder',
      LoadoutBuilderComponent,
      lazyInjector.$injector as angular.auto.IInjectorService
    ),
    url: '/loadout-builder'
  }
];
