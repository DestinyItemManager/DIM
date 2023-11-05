import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
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
    if (subclass?.loadoutItem.socketOverrides) {
      for (const hash of Object.values(subclass.loadoutItem.socketOverrides)) {
        equippedHashes.add(hash);
      }
    }
    return equippedHashes;
  }, [params.exoticArmorHash, subclass?.loadoutItem.socketOverrides]);
}
