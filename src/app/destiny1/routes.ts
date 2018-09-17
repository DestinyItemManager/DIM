import { destinyAccountResolver } from '../accounts/destiny-account-resolver';
import { ReactStateDeclaration } from '@uirouter/react';
import Destiny from '../shell/Destiny';
import { angular2react } from 'angular2react';
import { D1InventoryComponent } from '../destiny1/d1-inventory.component';
import { lazyInjector } from '../../lazyInjector';
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
    component: $featureFlags.reactInventory
      ? Inventory
      : angular2react(
          'inventory1',
          D1InventoryComponent,
          lazyInjector.$injector as angular.auto.IInjectorService
        )
  },
  ...recordBookStates,
  ...activitiesStates,
  ...loadoutBuilderStates,
  ...vendorsStates
];
