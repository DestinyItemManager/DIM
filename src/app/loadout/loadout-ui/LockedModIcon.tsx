import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import React from 'react';
import ClosableContainer from './ClosableContainer';
import styles from './LockedModIcon.m.scss';

interface Props {
  mod: PluggableInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  onModClicked(): void;
}

function LockedModIcon({ mod, defs, onModClicked }: Props) {
  return (
    <ClosableContainer onClose={onModClicked} showCloseIconOnHover={true}>
      <div className={styles.emptyItem}>
        <SocketDetailsMod itemDef={mod} defs={defs} />
      </div>
    </ClosableContainer>
  );
}

export default LockedModIcon;
