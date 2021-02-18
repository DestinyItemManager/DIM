import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import React from 'react';
import ClosableContainer from '../ClosableContainer';
import { LockedMod } from '../types';
import styles from './LockedItem.m.scss';

interface Props {
  item: LockedMod;
  defs: D2ManifestDefinitions;
  onModClicked(): void;
}

function LockedModIcon({ item, defs, onModClicked }: Props) {
  return (
    <ClosableContainer onClose={onModClicked} showCloseIconOnHover={true}>
      <div className={styles.emptyItem}>
        <SocketDetailsMod itemDef={item.modDef} defs={defs} />
      </div>
    </ClosableContainer>
  );
}

export default LockedModIcon;
