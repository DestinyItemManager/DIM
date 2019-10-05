import React from 'react';

import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import { numberFormatter } from 'app/utils/util';
import { settings } from 'app/settings/settings';

export function Reward({
  reward,
  defs
}: {
  reward: DestinyItemQuantity;
  defs: D2ManifestDefinitions;
}) {
  const rewardDisplay = defs.InventoryItem.get(reward.itemHash).displayProperties;

  return (
    <div className="milestone-reward">
      <BungieImage src={rewardDisplay.icon} />
      <span>
        {rewardDisplay.name}
        {reward.quantity > 1 && ` +${numberFormatter(settings.language).format(reward.quantity)}`}
      </span>
    </div>
  );
}
