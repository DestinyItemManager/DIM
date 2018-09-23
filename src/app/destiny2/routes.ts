import { destinyAccountResolver } from '../accounts/destiny-account-resolver';
import { ReactStateDeclaration } from '@uirouter/react';
import Destiny from '../shell/Destiny';
import Inventory from '../inventory/Inventory';

// Root state for Destiny 2 views
export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2',
    redirectTo: 'destiny2.inventory',
    url: '/:membershipId-{platformType:int}/d2',
    component: Destiny,
    resolve: {
      account: destinyAccountResolver(2)
    }
  },
  {
    name: 'destiny2.inventory',
    url: '/inventory',
    component: Inventory
  }
];
