import { ReactStateDeclaration } from '@uirouter/react';
import D1Vendors from './D1Vendors';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.vendors',
    component: D1Vendors,
    url: '/vendors'
  }
];
