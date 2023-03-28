import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';

import { allItemsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { fullyResolvedLoadoutsSelector } from 'app/loadout-drawer/selectors';
import { AppIcon, addIcon, faCheckCircle, faExclamationCircle, saveIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { showInGameLoadoutDetails } from './InGameLoadoutDetailsSheet';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import styles from './InGameLoadoutStrip.m.scss';
import { applyInGameLoadout, deleteInGameLoadout } from './ingame-loadout-apply';
import { implementsDimLoadout, itemCouldBeEquipped } from './ingame-loadout-utils';
import { inGameLoadoutsForCharacterSelector } from './selectors';

export function InGameLoadoutStrip({ selectedStoreId }: { selectedStoreId: string }) {
  const stores = useSelector(sortedStoresSelector);
  const selectedStore = getStore(stores, selectedStoreId)!;

  const { currentLoadout, loadouts: savedLoadouts } = useSelector(
    fullyResolvedLoadoutsSelector(selectedStoreId)
  );
  const inGameLoadouts = useSelector((state: RootState) =>
    inGameLoadoutsForCharacterSelector(state, selectedStoreId)
  );
  const inGameLoadoutsDict = _.keyBy(inGameLoadouts, (l) => l.index);

  const allItems = useSelector(allItemsSelector);

  const dispatch = useThunkDispatch();
  getItemsFromLoadoutItems;
  // TO-DO: THIS MUST USE availableLoadoutSlotsSelector ONCE IT IS MERGED
  return (
    <div className={styles.loadoutStrip}>
      {Array(10)
        .fill(0)
        .map((_x, loadoutIndex) => {
          const gameLoadout = inGameLoadoutsDict[loadoutIndex];

          if (!gameLoadout) {
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
          const isEquippable = gameLoadout.items.every((li) => {
            const liveItem = allItems.find((di) => di.id === li.itemInstanceId);
            return !liveItem || itemCouldBeEquipped(selectedStore, liveItem, stores);
          });

          const isEquipped = implementsDimLoadout(
            gameLoadout,
            currentLoadout.resolvedLoadoutItems,
            currentLoadout.resolvedMods
          );

          const matchingLoadouts = savedLoadouts.filter(
            (dimLoadout) =>
              dimLoadout.loadout.items.length > 4 &&
              implementsDimLoadout(
                gameLoadout,
                dimLoadout.resolvedLoadoutItems,
                dimLoadout.resolvedMods
              )
          );
          const options: Option[] = _.compact([
            {
              key: 'apply',
              content: 'Apply',
              onSelected: () => dispatch(applyInGameLoadout(gameLoadout)),
            },
            !isEquippable && {
              key: 'prep',
              content: 'Prepare for Application',
              onSelected: () => {
                /* pretend we do something here */
              },
            },
            {
              key: 'delete',
              content: 'Clear Slot ' + (loadoutIndex + 1),
              onSelected: () => dispatch(deleteInGameLoadout(gameLoadout)),
            },
          ]);

          const tooltipContent: JSX.Element[] = [
            <Tooltip.Header key="header" text={gameLoadout.name} />,
          ];
          if (matchingLoadouts.length) {
            tooltipContent.push(
              <React.Fragment key="matchingloadouts">
                <AppIcon icon={saveIcon} /> Matching Loadouts:
                {matchingLoadouts.map((l) => (
                  <div key={l.loadout.id}>
                    <ColorDestinySymbols text={l.loadout.name} />
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
                  isEquippable ? styles.equipOk : styles.equipNok
                )}
              />
              <span>{isEquippable ? 'In-Game Equip Ready' : 'In-Game Equip Not Ready'}</span>
            </React.Fragment>
          );

          return (
            <div
              key={gameLoadout.index}
              className={clsx(styles.inGameTileWrapper, isEquipped && styles.isEquipped)}
            >
              <PressTip tooltip={tooltipContent.length ? tooltipContent : null} placement="bottom">
                <div
                  className={styles.inGameTile}
                  onClick={() => showInGameLoadoutDetails(gameLoadout)}
                >
                  <div className={styles.igtIconHolder}>
                    <InGameLoadoutIconWithIndex loadout={gameLoadout} className={styles.igtIcon} />
                  </div>
                  {/* <ColorDestinySymbols text={loadout.name} className={styles.igtName} /> */}
                  {isEquippable ? (
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
