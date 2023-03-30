import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import { DimItem } from 'app/inventory/item-types';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import { useMemo } from 'react';
import Armory from './Armory';
import styles from './ArmorySheet.m.scss';

export default function ArmorySheet({ item, onClose }: { item: DimItem; onClose: () => void }) {
  const realItemSockets = useMemo(
    () =>
      item.sockets
        ? Object.fromEntries(
            item.sockets.allSockets
              .filter((s) => s.plugged)
              .map((s) => [s.socketIndex, s.plugged!.plugDef.hash])
          )
        : {},
    [item.sockets]
  );
  const realAvailablePlugHashes = useMemo(
    () => item.sockets?.allSockets.flatMap((s) => s.plugOptions.map((p) => p.plugDef.hash)) ?? [],
    [item.sockets]
  );

  // If we're opening a dummy weapon from a Vendor (like for item focusing),
  // try to find the definition of what a user would expect.
  const betterItemHash = item.vendor && focusingItemOutputs[item.hash];

  return (
    <Sheet onClose={onClose} sheetClassName={styles.sheet}>
      <ClickOutsideRoot>
        <Armory
          itemHash={betterItemHash ?? item.hash}
          // Only use the sockets if we didn't change what item we're even looking at.
          realItemSockets={betterItemHash === undefined ? realItemSockets : undefined}
          realAvailablePlugHashes={
            betterItemHash === undefined ? realAvailablePlugHashes : undefined
          }
        />
      </ClickOutsideRoot>
    </Sheet>
  );
}
