import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import { DimItem } from 'app/inventory/item-types';
import { filterMap } from 'app/utils/collections';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import { Suspense, useMemo } from 'react';
import styles from './ArmorySheet.m.scss';
import Armory from './LazyArmory';

export default function ArmorySheet({
  item,
  itemHash,
  onClose,
}: { onClose: () => void } & (
  | { item: DimItem; itemHash?: undefined }
  | { itemHash: number; item?: undefined }
)) {
  const realItemSockets = useMemo(
    () =>
      item?.sockets
        ? Object.fromEntries(
            filterMap(item.sockets.allSockets, (s) =>
              s.plugged ? [s.socketIndex, s.plugged.plugDef.hash] : undefined,
            ),
          )
        : {},
    [item?.sockets],
  );
  const realAvailablePlugHashes = useMemo(
    () => item?.sockets?.allSockets.flatMap((s) => s.plugOptions.map((p) => p.plugDef.hash)) ?? [],
    [item?.sockets],
  );

  // If we're opening a dummy weapon from a Vendor (like for item focusing),
  // try to find the definition of what a user would expect.
  const betterItemHash = item?.vendor && focusingItemOutputs[item.hash];

  return (
    <Suspense fallback={null}>
      <Sheet onClose={onClose} sheetClassName={styles.sheet}>
        <ClickOutsideRoot>
          <Armory
            itemHash={itemHash ?? betterItemHash ?? item.hash}
            // Only use the sockets if we didn't change what item we're even looking at.
            realItemSockets={betterItemHash === undefined ? realItemSockets : undefined}
            realAvailablePlugHashes={
              betterItemHash === undefined ? realAvailablePlugHashes : undefined
            }
          />
        </ClickOutsideRoot>
      </Sheet>
    </Suspense>
  );
}
