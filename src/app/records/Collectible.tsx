import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { DimCollectible } from './presentation-nodes';

interface Props {
  collectible: DimCollectible;
  owned: boolean;
}

export default function Collectible({ collectible, owned }: Props) {
  const { state, item } = collectible;
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
