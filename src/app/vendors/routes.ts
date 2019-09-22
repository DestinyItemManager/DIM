import { ReactStateDeclaration } from '@uirouter/react';
import Vendors from './Vendors';
import SingleVendor from './SingleVendor';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.vendors',
    component: Vendors,
    url: '/vendors?characterId'
  },
  {
    name: 'destiny2.vendor',
    component: SingleVendor,
    url: '/vendors/:id?characterId'
  }
];
