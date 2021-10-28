import { bungieNetPath } from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import Sheet from 'app/dim-ui/Sheet';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styles from './SubclassDrawer.m.scss';
import SubclassOptions from './SubclassOptions';
import { SelectedPlugs } from './types';

export default function SubclassDrawer({
  classType,
  initialSubclass,
  initialPlugs = [],
  onAccept,
  onClose,
}: {
  classType: DestinyClass;
  initialSubclass?: DimItem;
  initialPlugs?: PluggableInventoryItemDefinition[];
  onAccept(subclass?: DimItem, plugs?: PluggableInventoryItemDefinition[]): void;
  onClose(): void;
}) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const allItems = useSelector(allItemsSelector, shallowEqual);
  const [selectedSubclass, setSelectedSubclass] = useState<DimItem | undefined>(initialSubclass);

  const subclasses = useMemo(() => {
    if (!defs) {
      return [];
    }
    return allItems
      .filter((item) => item.bucket.type === 'Class' && item.classType === classType)
      .map((item) => item);
  }, [allItems, classType, defs]);

  const [selectedPlugsBySubclass, setSelectedPlugsBySubclass] = useState(() =>
    createSelectedPlugsInitialState(subclasses, initialSubclass, initialPlugs)
  );

  const screenshot =
    !isPhonePortrait &&
    selectedSubclass &&
    defs?.InventoryItem.get(selectedSubclass.hash).screenshot;

  const title =
    subclasses.length && defs?.InventoryItem.get(subclasses[0].hash).itemTypeDisplayName;

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    const plugs = selectedSubclass
      ? _.compact(Object.values(selectedPlugsBySubclass[selectedSubclass.hash]).flat())
      : [];
    onAccept(selectedSubclass, plugs);
    onClose();
  };

  const footer = ({ onClose }: { onClose(): void }) => (
    <div>
      <button className={styles.submitButton} type="button" onClick={(e) => onSubmit(e, onClose)}>
        Accept
      </button>
    </div>
  );

  return (
    <Sheet
      header={<div className={styles.title}>{title}</div>}
      fillScreen={true}
      onClose={onClose}
      footer={footer}
    >
      <div className={styles.container}>
        {screenshot && (
          <div
            className={styles.background}
            style={{ backgroundImage: `url("${bungieNetPath(screenshot)}")` }}
          />
        )}
        <div className={styles.subclasses}>
          {subclasses.map((subclass) => (
            <div
              key={subclass.id}
              onClick={() => setSelectedSubclass(subclass)}
              className={clsx('loadout-item', styles.subclass, {
                [styles.selected]: subclass.id === selectedSubclass?.id,
              })}
            >
              <ConnectedInventoryItem item={subclass} ignoreSelectedPerks={true} />
              {subclass.type === 'Class' && (
                <ClassIcon classType={subclass.classType} className="loadout-item-class-icon" />
              )}
            </div>
          ))}
        </div>
        {selectedSubclass && defs && (
          <SubclassOptions
            selectedSubclass={selectedSubclass}
            defs={defs}
            selectedPlugs={selectedPlugsBySubclass[selectedSubclass.hash]}
            setSelectedPlugs={(selectedPlugs) => {
              if (selectedSubclass) {
                setSelectedPlugsBySubclass((oldState) => {
                  const newState = { ...oldState };
                  newState[selectedSubclass.hash] = selectedPlugs;
                  return newState;
                });
              }
            }}
          />
        )}
      </div>
    </Sheet>
  );
}

function createSelectedPlugsInitialState(
  subclasses: DimItem[],
  initialSubclass: DimItem | undefined,
  initialPlugs: PluggableInventoryItemDefinition[]
): { [subclassHash: number]: SelectedPlugs } {
  const initialState = {};
  for (const subclass of subclasses) {
    initialState[subclass.hash] = {};
  }
  if (initialSubclass) {
    initialState[initialSubclass.hash] = _.groupBy(
      initialPlugs,
      (item) => item.plug.plugCategoryHash
    );
  }

  return initialState;
}
