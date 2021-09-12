import { currentAccountSelector } from 'app/accounts/selectors';
import Sheet from 'app/dim-ui/Sheet';
import React from 'react';
import { useSelector } from 'react-redux';
import Armory from './Armory';
import styles from './ArmorySheet.m.scss';

export default function ArmorySheet({ itemHash, onClose }: { itemHash: number; onClose(): void }) {
  const account = useSelector(currentAccountSelector)!;
  return (
    <Sheet onClose={onClose} sheetClassName={styles.sheet}>
      <Armory account={account} itemHash={itemHash} />
    </Sheet>
  );
}
