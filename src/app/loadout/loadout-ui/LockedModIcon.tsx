import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import React from 'react';
import styles from './LockedModIcon.m.scss';

interface Props {
  mod: PluggableInventoryItemDefinition;
  onModClicked(): void;
}

function LockedModIcon({ mod, onModClicked }: Props) {
  return (
    <ClosableContainer onClose={onModClicked} showCloseIconOnHover={true}>
      <div className={styles.emptyItem}>
        <SocketDetailsMod itemDef={mod} />
      </div>
    </ClosableContainer>
  );
}

export default LockedModIcon;
