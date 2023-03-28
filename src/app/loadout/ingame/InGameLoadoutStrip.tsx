import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { AppIcon, faCheckCircle, faExclamationCircle, saveIcon } from 'app/shell/icons';
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
import { inGameLoadoutsWithMetadataSelector } from './selectors';

export function InGameLoadoutStrip({ selectedStoreId }: { selectedStoreId: string }) {
  const inGameLoadoutInfos = useSelector((state: RootState) =>
    inGameLoadoutsWithMetadataSelector(state, selectedStoreId)
  );

  const dispatch = useThunkDispatch();
  // TO-DO: THIS MUST USE availableLoadoutSlotsSelector ONCE IT IS MERGED
  return (
    <div className={styles.loadoutStrip}>
      {inGameLoadoutInfos.map(({ isEquippable, isEquipped, matchingLoadouts, gameLoadout }) => {
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
            content: 'Clear Slot ' + (gameLoadout.index + 1),
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
