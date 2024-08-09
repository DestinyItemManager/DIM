import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { getSubclassPlugHashes } from 'app/loadout/loadout-item-utils';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useMemo } from 'react';

export default function useEquippedHashes(
  params: LoadoutParameters,
  subclass: ResolvedLoadoutItem | undefined,
) {
  return useMemo(() => {
    const exoticArmorHash = params.exoticArmorHash;
    // Fill in info about selected items / subclass options for Clarity character stats
    const equippedHashes = new Set<number>();
    if (exoticArmorHash) {
      equippedHashes.add(exoticArmorHash);
    }
    for (const { plugHash } of getSubclassPlugHashes(subclass)) {
      equippedHashes.add(plugHash);
    }
    return equippedHashes;
  }, [params.exoticArmorHash, subclass]);
}
