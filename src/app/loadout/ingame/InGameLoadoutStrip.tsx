import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { convertInGameLoadoutToDimLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, faCheckCircle, faExclamationCircle, saveIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import styles from './InGameLoadoutStrip.m.scss';
import { applyInGameLoadout, deleteInGameLoadout, prepInGameLoadout } from './ingame-loadout-apply';
import { fullyResolvedLoadoutsSelector, inGameLoadoutsWithMetadataSelector } from './selectors';

export function InGameLoadoutStrip({
  store,
  onEdit,
  onShare,
  onShowDetails,
}: {
  store: DimStore;
  onEdit: (loadout: InGameLoadout) => void;
  onShare: (loadout: Loadout) => void;
  onShowDetails: (loadout: InGameLoadout) => void;
}) {
  const selectedStoreId = store.id;
  const inGameLoadoutInfos = useSelector((state: RootState) =>
    inGameLoadoutsWithMetadataSelector(state, selectedStoreId)
  );

  return (
    <div className={styles.loadoutStrip}>
      {inGameLoadoutInfos.map(({ isEquippable, isEquipped, matchingLoadouts, gameLoadout }) => (
        <InGameLoadoutTile
          store={store}
          key={gameLoadout.id}
          gameLoadout={gameLoadout}
          isEquippable={isEquippable}
          isEquipped={isEquipped}
          matchingLoadouts={matchingLoadouts}
          onEdit={onEdit}
          onShare={onShare}
          onShowDetails={onShowDetails}
        />
      ))}
    </div>
  );
}

function InGameLoadoutTile({
  store,
  gameLoadout,
  isEquippable,
  isEquipped,
  matchingLoadouts,
  onEdit,
  onShare,
  onShowDetails,
}: {
  store: DimStore;
  gameLoadout: InGameLoadout;
  isEquippable: boolean;
  isEquipped: boolean;
  matchingLoadouts: ReturnType<typeof fullyResolvedLoadoutsSelector>['loadouts'];
  onEdit: (loadout: InGameLoadout) => void;
  onShare: (loadout: Loadout) => void;
  onShowDetails: (loadout: InGameLoadout) => void;
}) {
  const dispatch = useThunkDispatch();
  const allItems = useSelector(allItemsSelector);

  const handleSaveAsDIM = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(gameLoadout, store.classType, allItems);
    editLoadout(dimLoadout, store.id, { isNew: true });
  };
  const handleShare = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(gameLoadout, store.classType, allItems);
    onShare(dimLoadout);
  };

  const options: Option[] = _.compact([
    {
      key: 'details',
      content: t('InGameLoadout.LoadoutDetails'),
      onSelected: () => onShowDetails(gameLoadout),
    },
    {
      key: 'apply',
      content: t('LoadoutBuilder.EquipItems'),
      onSelected: () => dispatch(applyInGameLoadout(gameLoadout)),
    },
    !isEquippable && {
      key: 'prep',
      content: t('InGameLoadout.PrepareEquip'),
      onSelected: () => dispatch(prepInGameLoadout(gameLoadout)),
    },
    {
      key: 'edit',
      content: t('InGameLoadout.PrepareEquip'),
      onSelected: () => onEdit(gameLoadout),
    },
    {
      key: 'saveAs',
      content: t('Loadouts.SaveAsDIM'),
      onSelected: handleSaveAsDIM,
    },
    {
      key: 'edit',
      content: t('Loadouts.ShareLoadout'),
      onSelected: handleShare,
    },
    {
      key: 'delete',
      content: (
        <span className={styles.deleteDanger}>
          {t('InGameLoadout.ClearSlot', { index: gameLoadout.index + 1 })}
        </span>
      ),
      onSelected: () => dispatch(deleteInGameLoadout(gameLoadout)),
    },
  ]);

  const tooltipContent: JSX.Element[] = [<Tooltip.Header key="header" text={gameLoadout.name} />];
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
        icon={isEquippable ? faCheckCircle : faExclamationCircle}
        className={clsx(styles.statusAppIcon, isEquippable ? styles.equipOk : styles.equipNok)}
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
        <div className={styles.inGameTile} onClick={() => onShowDetails(gameLoadout)}>
          <div className={styles.igtIconHolder}>
            <InGameLoadoutIconWithIndex loadout={gameLoadout} className={styles.igtIcon} />
          </div>
          {/* <ColorDestinySymbols text={loadout.name} className={styles.igtName} /> */}
          <AppIcon
            icon={isEquippable ? faCheckCircle : faExclamationCircle}
            className={clsx(styles.statusAppIcon, isEquippable ? styles.equipOk : styles.equipNok)}
          />
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
}
