import { ReactStateDeclaration } from '@uirouter/react';
import { SettingsComponent } from './settings.component';
import { lazyInjector } from '../../lazyInjector';
import { angular2react } from 'angular2react';
import { settingsReady } from './settings';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings',
    component: angular2react(
      'dimSettings',
      SettingsComponent,
      lazyInjector.$injector as angular.auto.IInjectorService
    ),
    url: '/settings?gdrive',
    resolve: {
      settings: () => settingsReady
    }
  }
];
