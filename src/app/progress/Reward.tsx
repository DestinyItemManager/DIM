import * as React from 'react';

import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';

export function Reward({
  reward,
  defs
}: {
  reward: DestinyItemQuantity;
  defs: D2ManifestDefinitions;
}) {
  return (
    <div className="milestone-reward">
      <BungieImage src={defs.InventoryItem.get(reward.itemHash).displayProperties.icon} />
      <span>
        {defs.InventoryItem.get(reward.itemHash).displayProperties.name}
        {reward.quantity > 1 && ` +${reward.quantity}`}
      </span>
    </div>
  );
}
