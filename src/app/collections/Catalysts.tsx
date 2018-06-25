import {
  DestinyProfileResponse,
  DestinyObjectiveProgress
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { VendorItem } from '../d2-vendors/vendor-item';
import { t } from 'i18next';

/**
 * A single plug set.
 */
export default function Catalysts({
  defs,
  profileResponse
}: {
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}) {
  const catalysts = getCatalysts(defs, profileResponse);

  return (
    <div className="vendor-char-items">
      <div className="vendor-row">
        <h3 className="category-title">
          Catalysts
          <div className="ornaments-disclaimer">{t("Vendors.CatalystsDisclaimer")}</div>
        </h3>
        <div className="vendor-items">
        {catalysts.map((catalyst) =>
          <VendorItemComponent
            key={catalyst.itemHash}
            defs={defs}
            item={VendorItem.forCatalyst(defs, catalyst.attachedItemHash, catalyst.itemHash, catalyst.objectives, catalyst.canInsert)}
            owned={false}
          />
        )}
        </div>
      </div>
    </div>
  );
}

interface CatalystInfo {
  attachedItemHash: number;
  itemHash: number;
  objectives: DestinyObjectiveProgress[];
  canInsert: boolean;
}

function getCatalysts(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse
): CatalystInfo[] {
  const plugsWithObjectives = {};
  _.each(profileResponse.itemComponents.sockets.data, (sockets, instanceHash) => {
    for (const socket of sockets.sockets) {
      if (socket.reusablePlugs) {
        for (const reusablePlug of socket.reusablePlugs) {
          if (reusablePlug.plugObjectives && reusablePlug.plugObjectives.length) {
            const item = defs.InventoryItem.get(reusablePlug.plugItemHash);
            // TODO: show the item, not the masterwork mod! But somehow patch in the mod as well...
            let itemHash;
            for (const item of allItemInstances(profileResponse)) {
              if (item.itemInstanceId === instanceHash) {
                itemHash = item.itemHash;
                break;
              }
            }
            if (item.plug && item.plug.uiPlugLabel === 'masterwork_interactable') {
              plugsWithObjectives[reusablePlug.plugItemHash] = {
                attachedItemHash: itemHash,
                itemHash: reusablePlug.plugItemHash,
                objectives: reusablePlug.plugObjectives,
                canInsert: reusablePlug.canInsert
              };
            }
          }
        }
      }
    }
  });

  return _.sortBy(Object.values(plugsWithObjectives), (catalyst) => {
    const item = defs.InventoryItem.get(catalyst.itemHash);
    return item.displayProperties.name;
  });
}

function *allItemInstances(profileResponse: DestinyProfileResponse) {
  for (const item of profileResponse.profileInventory.data.items) {
    yield item;
  }
  for (const character of Object.values(profileResponse.characterInventories.data)) {
    for (const item of character.items) {
      yield item;
    }
  }
  for (const character of Object.values(profileResponse.characterEquipment.data)) {
    for (const item of character.items) {
      yield item;
    }
  }
}
