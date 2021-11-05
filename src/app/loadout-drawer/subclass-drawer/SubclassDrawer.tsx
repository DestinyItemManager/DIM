import { bungieNetPath } from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useCallback, useMemo, useReducer } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import Options from './Options';
import { SDDispatch, sdInit, sdReducer } from './reducer';
import styles from './SubclassDrawer.m.scss';

export default function SubclassDrawer({
  classType,
  initialSubclass,
  initialPlugs = [],
  onAccept,
  onClose: onCloseProp,
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

  const [state, dispatch] = useReducer(
    sdReducer,
    { subclasses, initialSubclass, initialPlugs },
    sdInit
  );

  const screenshot =
    !isPhonePortrait && state.subclass && defs?.InventoryItem.get(state.subclass.hash).screenshot;

  const title =
    subclasses.length > 0
      ? defs?.InventoryItem.get(subclasses[0].hash).itemTypeDisplayName
      : undefined;

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    const plugs = state.subclass
      ? _.compact(Object.values(state.plugsBySubclassHash[state.subclass.hash]).flat())
      : [];
    onAccept(state.subclass, plugs);
    onClose();
  };

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
      onClose={onCloseProp}
      footer={footer}
    >
      <div className={styles.container}>
        {screenshot && (
          <div
            className={styles.background}
            style={bungieBackgroundStyle(screenshot)}
          />
        )}
        <div className={styles.contents}>
          <div className={styles.subclasses}>
            {subclasses.map((subclass) => (
              <Subclass
                key={subclass.id}
                subclass={subclass}
                isSelected={subclass.id === state.subclass?.id}
                dispatch={dispatch}
              />
            ))}
          </div>
          {state.subclass && defs && (
            <Options
              selectedSubclass={state.subclass}
              defs={defs}
              selectedPlugs={state.plugsBySubclassHash[state.subclass.hash]}
              dispatch={dispatch}
            />
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Subclass({
  subclass,
  isSelected,
  dispatch,
}: {
  subclass: DimItem;
  isSelected: boolean;
  dispatch: SDDispatch;
}) {
  const onClick = useCallback(() => {
    dispatch({ type: 'update-subclass', subclass });
  }, [subclass, dispatch]);

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
