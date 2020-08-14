import React from 'react';
import ClosableContainer from '../ClosableContainer';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { LockedArmor2Mod, LockedModBase } from '../types';
import styles from './LockedItem.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

interface Props {
  item: LockedArmor2Mod | LockedModBase;
  defs: D2ManifestDefinitions;
  onModClicked(): void;
}

function LockedArmor2ModIcon({ item, defs, onModClicked }: Props) {
  return (
    <ClosableContainer onClose={onModClicked}>
      <div className={styles.emptyItem}>
        <SocketDetailsMod itemDef={item.mod} defs={defs} />
      </div>
    </ClosableContainer>
  );
}

export default LockedArmor2ModIcon;
