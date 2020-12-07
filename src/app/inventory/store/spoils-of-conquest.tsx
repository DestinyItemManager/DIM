import type { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import type { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { showNotification } from '../../notifications/notifications';
import type { DimItem } from '../item-types';
import type { DimStore } from '../store-types';

const warnSpoilsInVault = _.debounce(
  (title: string, icon: JSX.Element) => {
    showNotification({
      type: 'warning',
      icon,
      title,
      body: t('ItemService.ShouldNotBeInVault'),
      duration: 10000,
    });
  },
  30000,
  {
    leading: true,
    trailing: false,
  }
);

/**
 * returns true if this is a Spoils of Conquest (3702027555) that's not in the vault
 *
 * if true, please do not transfer this item!! spoils can't safely be in the vault
 */
export function isSpoilsOnCharacter(
  itemDef: DestinyInventoryItemDefinition,
  owner: DimStore<DimItem> | undefined,
  defs: D2ManifestDefinitions
) {
  if (itemDef.hash === 3702027555) {
    if (owner?.isVault) {
      const spoilsDef = defs.InventoryItem.get(3702027555);
      warnSpoilsInVault(
        spoilsDef.displayProperties.name,
        <BungieImage
          style={{ height: 48, width: 48, border: '1px solid #ccc' }}
          src={spoilsDef.displayProperties.icon}
        />
      );
    } else {
      // it's spoils, but it's in the right place. return true to prevent transfers
      return true;
    }
  }
  return false;
}
