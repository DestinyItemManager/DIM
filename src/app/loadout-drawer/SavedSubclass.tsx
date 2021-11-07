import { DimItem } from 'app/inventory/item-types';
import ItemSocketsGeneral from 'app/item-popup/ItemSocketsGeneral';
import React from 'react';
import styles from './SavedSubclass.m.scss';
import { Subclass } from './subclass-drawer/SubclassDrawer';

export default function SavedSubclass({
  subclass,
  openSubclassDrawer,
}: {
  subclass: DimItem;
  openSubclassDrawer(): void;
}) {
  return (
    <div className={styles.container}>
      <Subclass subclass={subclass} isSelected={true} onSubclassClick={openSubclassDrawer} />
      <ItemSocketsGeneral item={subclass} />
    </div>
  );
}
