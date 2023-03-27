import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { t } from 'app/i18next-t';
import { allItemsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { isInGameLoadout } from 'app/loadout-drawer/loadout-types';
import { newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, addIcon, faCheckCircle, faExclamationCircle, saveIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSavedLoadoutsForClassType } from '../loadout-ui/menu-hooks';
import { showInGameLoadoutDetails } from './InGameLoadoutDetailsSheet';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import styles from './InGameLoadoutStrip.m.scss';
import { applyInGameLoadout, deleteInGameLoadout } from './ingame-loadout-apply';
import { implementsDimLoadout, itemCouldBeEquipped } from './ingame-loadout-utils';
import { inGameLoadoutsForCharacterSelector } from './selectors';

export function InGameLoadoutStrip({
  classType,
  selectedStoreId,
}: {
  classType: DestinyClass;
  selectedStoreId: string;
}) {
  const stores = useSelector(sortedStoresSelector);
  const selectedStore = getStore(stores, selectedStoreId)!;
  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
    [selectedStore]
  );
  const savedLoadouts = useSavedLoadoutsForClassType(classType);
  const inGameLoadouts = useSelector((state: RootState) =>
    inGameLoadoutsForCharacterSelector(state, selectedStoreId)
  );
  const inGameLoadoutsDict = _.keyBy(inGameLoadouts, (l) => l.index);

  const allItems = useSelector(allItemsSelector);
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();

  // TO-DO: THIS MUST USE availableLoadoutSlotsSelector ONCE IT IS MERGED
  return (
    <div className={styles.loadoutStrip}>
      {Array(10)
        .fill(0)
        .map((_, loadoutIndex) => {
          const loadout = inGameLoadoutsDict[loadoutIndex];
          if (!loadout) {
            return (
              <div
                key={`empty${loadoutIndex}`}
                className={clsx(styles.inGameTileWrapper, styles.addLoadoutTileWrapper)}
              >
                <button
                  // className={styles.pickModButton}
                  type="button"
                  // title={t('Loadouts.PickMods')}
                  // onClick={() => setShowModPicker(true)}
                >
                  <AppIcon icon={addIcon} />
                  <div className={styles.addLoadoutIndexNumber}>{loadoutIndex + 1}</div>
                </button>
              </div>
            );
          }
          const equippable = loadout.items.every((li) => {
            const liveItem = allItems.find((di) => di.id === li.itemInstanceId);
            return !liveItem || itemCouldBeEquipped(selectedStore, liveItem, stores);
          });
          const isEquipped = implementsDimLoadout(loadout, currentLoadout, defs);
          const matchingLoadouts = savedLoadouts.filter(
            (l) =>
              !isInGameLoadout(l) && l.items.length > 4 && implementsDimLoadout(loadout, l, defs)
          );
          const options: Option[] = [
            {
              key: 'apply',
              content: 'Apply',
              onSelected: () => dispatch(applyInGameLoadout(loadout)),
            },
            {
              key: 'delete',
              content: 'Clear Slot ' + (loadoutIndex + 1),
              onSelected: () => dispatch(deleteInGameLoadout(loadout)),
            },
          ];

          const tooltipContent: JSX.Element[] = [
            <Tooltip.Header key="header" text={loadout.name} />,
          ];
          if (matchingLoadouts.length) {
            tooltipContent.push(
              <React.Fragment key="matchingloadouts">
                <AppIcon icon={saveIcon} /> Matching Loadouts:
                {matchingLoadouts.map((l) => (
                  <div key={l.id}>
                    <ColorDestinySymbols text={l.name} />
                  </div>
                ))}
              </React.Fragment>
            );
          }
          if (isEquipped) {
            tooltipContent.push(
              <React.Fragment key="isequipped">
                {tooltipContent.length > 1 && <hr />}
                {/* <img
                  src={helmetIcon}
                  className={clsx(styles.svgIcon, styles.statusIconSvg)}
                  alt="is currently equipped"
                /> */}
                <span className={clsx(styles.isEquipped, styles.blankBox)} />
                <span>Currently Equipped</span>
              </React.Fragment>
            );
          }

          tooltipContent.push(
            <React.Fragment key="equippable">
              {tooltipContent.length > 1 && <hr />}
              <AppIcon
                icon={faCheckCircle}
                className={clsx(
                  styles.statusAppIcon,
                  equippable ? styles.equipOk : styles.equipNok
                )}
              />
              <span>{equippable ? 'In-Game Equip Ready' : 'In-Game Equip Not Ready'}</span>
            </React.Fragment>
          );

          return (
            <div
              key={loadout.index}
              className={clsx(styles.inGameTileWrapper, isEquipped && styles.isEquipped)}
            >
              <PressTip tooltip={tooltipContent.length ? tooltipContent : null} placement="bottom">
                <div
                  className={styles.inGameTile}
                  onClick={() => showInGameLoadoutDetails(loadout)}
                >
                  <div className={styles.igtIconHolder}>
                    <InGameLoadoutIconWithIndex loadout={loadout} className={styles.igtIcon} />
                  </div>
                  {/* <ColorDestinySymbols text={loadout.name} className={styles.igtName} /> */}
                  {equippable ? (
                    <AppIcon
                      icon={faCheckCircle}
                      className={clsx(styles.statusAppIcon, styles.equipOk)}
                    />
                  ) : (
                    <AppIcon
                      icon={faExclamationCircle}
                      className={clsx(styles.statusAppIcon, styles.equipNok)}
                    />
                  )}
                  {matchingLoadouts.length > 0 && (
                    <AppIcon icon={saveIcon} className={styles.statusAppIcon} />
                  )}
                  {/* {isEquipped && (
                  <img
                    src={helmetIcon}
                    className={clsx(styles.svgIcon, styles.statusIconSvg)}
                    alt="is currently equipped"
                  />
                )} */}
                  {/* <div className={styles.igtProps}>

                </div> */}
                </div>
              </PressTip>
              <Dropdown kebab options={options} placement="bottom-end" className={styles.kebab} />
            </div>
          );
        })}
    </div>
  );
}
