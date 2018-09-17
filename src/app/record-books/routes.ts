import { ReactStateDeclaration } from '@uirouter/react';
import { angular2react } from 'angular2react';
import { RecordBooksComponent } from './record-books.component';
import { lazyInjector } from '../../lazyInjector';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.record-books',
    component: angular2react(
      'recordBooks',
      RecordBooksComponent,
      lazyInjector.$injector as angular.auto.IInjectorService
    ),
    url: '/record-books'
  }
];
