import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import { DimItem } from 'app/inventory/item-types';
import React, { useMemo } from 'react';
import Armory from './Armory';
import styles from './ArmorySheet.m.scss';

export default function ArmorySheet({ item, onClose }: { item: DimItem; onClose(): void }) {
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

  return (
    <Sheet onClose={onClose} sheetClassName={styles.sheet}>
      <ClickOutsideRoot>
        <Armory
          itemHash={item.hash}
          realItemSockets={realItemSockets}
          realAvailablePlugHashes={realAvailablePlugHashes}
        />
      </ClickOutsideRoot>
    </Sheet>
  );
}
