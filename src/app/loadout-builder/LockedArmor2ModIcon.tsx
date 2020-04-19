import React from 'react';
import ClosableContainer from './ClosableContainer';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { LockedArmor2Mod } from './types';
import styles from './LockedItem.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

interface Props {
  item: LockedArmor2Mod;
  defs: D2ManifestDefinitions;
  onModClicked(): void;
}

function LockedArmor2ModIcon({ item, defs, onModClicked }: Props) {
  return (
    <ClosableContainer onClose={onModClicked} key={item.mod.hash}>
      <div className={styles.emptyItem}>
        <SocketDetailsMod itemDef={item.mod} defs={defs} />
      </div>
    </ClosableContainer>
  );
}

export default LockedArmor2ModIcon;
