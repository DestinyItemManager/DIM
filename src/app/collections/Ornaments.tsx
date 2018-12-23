import { DestinyProfileResponse, DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { VendorItem } from '../d2-vendors/vendor-item';
import { t } from 'i18next';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';

/**
 * A single plug set.
 */
export default function Ornaments({
  defs,
  buckets,
  profileResponse
}: {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
}) {
  const ornaments = getOrnaments(defs, profileResponse);

  return (
    <div className="vendor-char-items">
      <div className="vendor-row no-badge">
        <CollapsibleTitle
          title={defs.Vendor.get(2107783226).displayProperties.name}
          sectionId="ornaments"
        >
          <div className="ornaments-disclaimer">{t('Vendors.OrnamentsDisclaimer')}</div>
          <div className="vendor-items no-badge">
            {ornaments.map((ornament) => (
              <VendorItemComponent
                key={ornament.itemHash}
                defs={defs}
                item={VendorItem.forOrnament(
                  defs,
                  buckets,
                  ornament.itemHash,
                  ornament.objectives,
                  ornament.enableFailReasons
                )}
                owned={false}
              />
            ))}
          </div>
        </CollapsibleTitle>
      </div>
    </div>
  );
}

interface OrnamentInfo {
  itemHash: number;
  objectives: DestinyObjectiveProgress[];
  canInsert: boolean;
  enableFailReasons: string[];
}

function getOrnaments(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse
): OrnamentInfo[] {
  const plugsWithObjectives: { [id: number]: OrnamentInfo } = {};
  _.each(profileResponse.itemComponents.sockets.data, (sockets) => {
    for (const socket of sockets.sockets) {
      if (socket.reusablePlugs) {
        for (const reusablePlug of socket.reusablePlugs) {
          if (reusablePlug.plugObjectives && reusablePlug.plugObjectives.length) {
            const item = defs.InventoryItem.get(reusablePlug.plugItemHash);
            if (item.itemCategoryHashes.includes(1742617626)) {
              plugsWithObjectives[reusablePlug.plugItemHash] = {
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

  return _.sortBy(Object.values(plugsWithObjectives), (ornament) => {
    const item = defs.InventoryItem.get(ornament.itemHash);
    return item.displayProperties.name;
  });
}
