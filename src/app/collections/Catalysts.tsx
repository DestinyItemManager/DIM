import { DestinyProfileResponse, DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { VendorItem } from '../d2-vendors/vendor-item';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';

/**
 * A single plug set.
 */
export default function Catalysts({
  defs,
  buckets,
  profileResponse
}: {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
}) {
  const catalysts = getCatalysts(defs, profileResponse);

  return (
    <div className="no-badge">
      <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId={'catalysts'}>
        <div className="ornaments-disclaimer">{t('Vendors.CatalystsDisclaimer')}</div>
        <div className="collectionItems">
          {catalysts.map((catalyst) => (
            <VendorItemComponent
              key={catalyst.itemHash}
              defs={defs}
              item={VendorItem.forOrnament(
                defs,
                buckets,
                catalyst.itemHash,
                catalyst.objectives,
                catalyst.enableFailReasons,
                catalyst.attachedItemHash
              )}
              owned={false}
            />
          ))}
        </div>
      </CollapsibleTitle>
    </div>
  );
}

interface CatalystInfo {
  attachedItemHash: number;
  itemHash: number;
  objectives: DestinyObjectiveProgress[];
  canInsert: boolean;
  enableFailReasons: string[];
}

function getCatalysts(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse
): CatalystInfo[] {
  const plugsWithObjectives: { [id: number]: CatalystInfo } = {};
  if (profileResponse.itemComponents.sockets.data) {
    _.forIn(profileResponse.itemComponents.sockets.data, (sockets, instanceHash) => {
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
                  canInsert: reusablePlug.canInsert,
                  enableFailReasons: (reusablePlug.insertFailIndexes || []).map(
                    (i) => item.plug.insertionRules[i].failureMessage
                  )
                };
              }
            }
          }
        }
      }
    });
  }

  return _.sortBy(Object.values(plugsWithObjectives), (catalyst) => {
    const item = defs.InventoryItem.get(catalyst.itemHash);
    return item.displayProperties.name;
  });
}

function* allItemInstances(profileResponse: DestinyProfileResponse) {
  if (profileResponse.profileInventory.data) {
    for (const item of profileResponse.profileInventory.data.items) {
      yield item;
    }
  }
  if (profileResponse.characterInventories.data) {
    for (const character of Object.values(profileResponse.characterInventories.data)) {
      for (const item of character.items) {
        yield item;
      }
    }
  }

  if (profileResponse.characterEquipment.data) {
    for (const character of Object.values(profileResponse.characterEquipment.data)) {
      for (const item of character.items) {
        yield item;
      }
    }
  }
}
