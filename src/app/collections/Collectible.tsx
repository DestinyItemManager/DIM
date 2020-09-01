import React from 'react';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import _ from 'lodash';
import { DimCollectible } from './presentation-nodes';

interface Props {
  collectible: DimCollectible;
  owned: boolean;
}

export default function Collectible({ collectible, owned }: Props) {
  const { state, collectibleDef, item } = collectible;
  const acquired = !(state & DestinyCollectibleState.NotAcquired);

  return (
    <VendorItemDisplay
      item={item}
      owned={owned}
      unavailable={!acquired}
      extraData={{ owned, acquired }}
    />
  );
}
