import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import React from 'react';
import styles from './LockedModIcon.m.scss';

interface Props {
  mod: PluggableInventoryItemDefinition;
  onClicked?(): void;
  onClosed?(): void;
}

function LockedModIcon({ mod, onClicked, onClosed }: Props) {
  const content = (
    <div className={styles.emptyItem}>
      <SocketDetailsMod itemDef={mod} onClick={onClicked} />
    </div>
  );

  // TODO (ryan) temporary until I make onClosed optional in ClosableContainer
  if (!onClosed) {
    return content;
  }

  return (
    <ClosableContainer onClose={onClosed} showCloseIconOnHover={true}>
      {content}
    </ClosableContainer>
  );
}

export default LockedModIcon;
