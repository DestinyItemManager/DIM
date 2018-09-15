import { destinyAccountResolver } from '../accounts/destiny-account-resolver';
import { ReactStateDeclaration } from '@uirouter/react';
import Destiny from '../shell/Destiny';
import { states as recordBookStates } from '../record-books/routes';
import { states as activitiesStates } from '../activities/routes';
import { states as loadoutBuilderStates } from '../loadout-builder/routes';
import { states as vendorsStates } from '../vendors/routes';
import Inventory from '../inventory/Inventory';

// Root state for Destiny 1 views
export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1',
    redirectTo: 'destiny1.inventory',
    url: '/:membershipId-{platformType:int}/d1',
    component: Destiny,
    resolve: {
      account: destinyAccountResolver(1)
    }
  },
  {
    name: 'destiny1.inventory',
    url: '/inventory',
    component: Inventory
  },
  ...recordBookStates,
  ...activitiesStates,
  ...loadoutBuilderStates,
  ...vendorsStates
];
