import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import {
  applySocketOverrides,
  SocketOverrides,
  SocketOverridesForItems,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useCallback, useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import '../../item-picker/ItemPicker.scss';
import ItemSocketsSubclass from './ItemSocketsSubclass';
import styles from './SubclassDrawer.m.scss';

export default function SubclassDrawer({
  classType,
  loadoutSubclasses = [],
  initialSocketOverrides,
  onAccept,
  onClose: onCloseProp,
}: {
  classType: DestinyClass;
  loadoutSubclasses?: DimItem[];
  initialSocketOverrides?: SocketOverridesForItems;
  onAccept(selected: { item: DimItem; socketOverrides: SocketOverrides }[]): void;
  onClose(): void;
}) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const [selectedSubclasses, setSelectedSubclasses] = useState<DimItem[]>(loadoutSubclasses);
  const [activeSubclass, setActiveSubclass] = useState(
    selectedSubclasses.length ? selectedSubclasses[0] : undefined
  );

  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems(initialSocketOverrides);
  const overriddenSubclass =
    activeSubclass &&
    defs &&
    applySocketOverrides(defs, activeSubclass, socketOverrides[activeSubclass.id]);

  const allItems = useSelector(allItemsSelector, shallowEqual);
  const subclasses = useMemo(() => {
    if (!defs) {
      return [];
    }
    return allItems
      .filter(
        (item) =>
          item.bucket.type === 'Class' &&
          (classType === DestinyClass.Unknown || item.classType === classType)
      )
      .map((item) => item);
  }, [allItems, classType, defs]);

  const screenshot =
    !isPhonePortrait && activeSubclass && defs?.InventoryItem.get(activeSubclass.hash).screenshot;

  const title =
    subclasses.length > 0
      ? defs?.InventoryItem.get(subclasses[0].hash).itemTypeDisplayName
      : undefined;

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(
      selectedSubclasses.map((subclass) => ({
        item: subclass,
        socketOverrides: socketOverrides[subclass.id],
      }))
    );
    onClose();
  };

  const onSubclassClick = useCallback((subclass: DimItem) => {
    setSelectedSubclasses((current) => {
      if (current.includes(subclass)) {
        return current;
      }

      const toSave = current.filter((c) => c.classType !== subclass.classType);
      return [...toSave, subclass];
    });
    setActiveSubclass(subclass);
  }, []);

  const footer = ({ onClose }: { onClose(): void }) => (
    <div>
      <button className={styles.submitButton} type="button" onClick={(e) => onSubmit(e, onClose)}>
        {t('Loadouts.Apply')}
      </button>
    </div>
  );

  return (
    <Sheet
      header={<div className={styles.title}>{title}</div>}
      fillScreen={true}
      sheetClassName="item-picker"
      onClose={onCloseProp}
      footer={footer}
    >
      <div className={styles.container}>
        {screenshot && (
          <div className={styles.background} style={bungieBackgroundStyle(screenshot)} />
        )}
        <div className={styles.contents}>
          <div className={styles.subclasses}>
            {subclasses.map((subclass) => (
              <Subclass
                key={subclass.id}
                subclass={subclass}
                isSelected={selectedSubclasses.some((s) => s.id === subclass.id)}
                onSubclassClick={onSubclassClick}
              />
            ))}
          </div>
          {overriddenSubclass && (
            <ItemSocketsSubclass item={overriddenSubclass} onPlugClicked={onPlugClicked} />
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function Subclass({
  subclass,
  isSelected,
  onSubclassClick,
}: {
  subclass: DimItem;
  isSelected: boolean;
  onSubclassClick(subclass: DimItem): void;
}) {
  const onClick = useCallback(() => {
    onSubclassClick(subclass);
  }, [subclass, onSubclassClick]);

  return (
    <div
      onClick={onClick}
      className={clsx('loadout-item', styles.subclass, {
        [styles.selected]: isSelected,
      })}
    >
      <ConnectedInventoryItem item={subclass} ignoreSelectedPerks={true} />
      {subclass.type === 'Class' && (
        <ClassIcon classType={subclass.classType} className="loadout-item-class-icon" />
      )}
    </div>
  );
}
