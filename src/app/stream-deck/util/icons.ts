import { LoadoutItem } from '@destinyitemmanager/dim-api-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { BucketHashes } from 'data/d2/generated-enums';

export function findSubClassIcon(items: LoadoutItem[], state: RootState) {
  const defs = d2ManifestSelector(state);
  for (const item of items) {
    const def = defs?.InventoryItem.get(item.hash);
    // find subclass item
    if (def?.inventory?.bucketTypeHash === BucketHashes.Subclass) {
      return def.displayProperties.icon;
    }
  }
}
