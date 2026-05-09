import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import {
  getExoticClassItemPerkHashes,
  isExoticClassItemWithPerks,
} from 'app/inventory/store/exotic-class-item';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { PlugDefTooltip } from 'app/item-popup/PlugTooltip';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareByIndex } from 'app/utils/comparators';
import { getExtraIntrinsicPerkHashes, getExtraIntrinsicPerkSockets } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { sample } from 'es-toolkit';
import anyExoticIcon from 'images/anyExotic.svg';
import noExoticIcon from 'images/noExotic.svg';
import noExoticPreferenceIcon from 'images/noExoticPreference.svg';
import { Dispatch, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { LOCKED_EXOTIC_ANY_EXOTIC, LOCKED_EXOTIC_NO_EXOTIC } from '../types';
import ExoticPicker, {
  ExoticPerkPicker,
  findLockableExotics,
  resolveExoticInfo,
} from './ExoticPicker';
import { exoticTileInfo } from './ExoticTile';
import * as styles from './LoadoutOptimizerExotic.m.scss';

const LoadoutOptimizerExotic = memo(function LoadoutOptimizerExotic({
  classType,
  className,
  storeId,
  lockedExoticHash,
  perks,
  vendorItems,
  lbDispatch,
}: {
  classType: DestinyClass;
  storeId: string;
  className?: string;
  lockedExoticHash: number | undefined;
  perks?: number[];
  vendorItems: DimItem[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);
  const [showExoticPerkPicker, setShowExoticPerkPicker] = useState(false);
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  const dispatchPerksFromItem = (item: DimItem) => {
    if (!isExoticClassItemWithPerks(item.hash)) {
      return;
    }
    const added = getExtraIntrinsicPerkHashes(item);
    if (added.length > 0) {
      lbDispatch({
        type: 'updatePerks',
        removed: getExoticClassItemPerkHashes(item.hash),
        added,
      });
    }
  };

  const handleClear = () => {
    lbDispatch({ type: 'removeLockedExotic' });
  };

  const handleSyncFromEquipped = () => {
    const equippedExotic = allItems.find(
      (i) => i.equipped && i.isExotic && i.bucket.inArmor && i.owner === storeId && i.energy,
    );
    lbDispatch({ type: 'lockExotic', lockedExoticHash: equippedExotic?.hash });
    if (equippedExotic) {
      dispatchPerksFromItem(equippedExotic);
    }
  };

  const handleClearPerks = (selectedPerks: number[]) => {
    if (selectedPerks.length) {
      lbDispatch({ type: 'updatePerks', removed: selectedPerks, added: [] });
    }
  };

  const handleRandomize = () => {
    const exotics = findLockableExotics(allItems, vendorItems, classType, defs);
    if (exotics.length === 0) {
      return;
    }
    const randomExotic = sample(exotics);
    lbDispatch({ type: 'lockExotic', lockedExoticHash: randomExotic.def.hash });
    const ownedRolls = allItems.filter(
      (i) => i.hash === randomExotic.def.hash && getExtraIntrinsicPerkSockets(i).length > 0,
    );
    if (ownedRolls.length > 0) {
      dispatchPerksFromItem(sample(ownedRolls));
    }
  };

  const handleClickEdit = () => setShowExoticPicker(true);
  const handleClickEditPerk = () => setShowExoticPerkPicker(true);

  const showPerks = isExoticClassItemWithPerks(lockedExoticHash);
  // Render selected perks in the same left-to-right order as the picker.
  const canonicalPerkOrder = getExoticClassItemPerkHashes(lockedExoticHash);
  const orderedPerks = (perks ?? [])
    .filter((p) => p !== 0 && canonicalPerkOrder.includes(p))
    .toSorted(compareByIndex(canonicalPerkOrder, (p) => p));

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.Exotic')}
      className={className}
      onClear={handleClear}
      onSyncFromEquipped={handleSyncFromEquipped}
      onRandomize={handleRandomize}
      onClearPerks={showPerks ? () => handleClearPerks(orderedPerks) : undefined}
    >
      <ChosenExoticOption lockedExoticHash={lockedExoticHash} onClick={handleClickEdit} />
      {showPerks && orderedPerks.length > 0 && (
        <div className={styles.selectedPerks} onClick={handleClickEditPerk}>
          {orderedPerks.map((perkHash) => {
            const def = defs.InventoryItem.get(perkHash);
            return (
              def &&
              isPluggableItem(def) && (
                <PressTip
                  key={perkHash}
                  tooltip={<PlugDefTooltip def={def} />}
                  placement="top"
                  className={styles.selectedPerk}
                >
                  <DefItemIcon itemDef={def} />
                  {def.displayProperties.name}
                </PressTip>
              )
            );
          })}
        </div>
      )}
      <div className={styles.buttons}>
        <button type="button" className="dim-button" onClick={handleClickEdit}>
          {t('LB.SelectExotic')}
        </button>
        {showPerks && (
          <button type="button" className="dim-button" onClick={handleClickEditPerk}>
            {t('LB.SelectPerks')}
          </button>
        )}
      </div>
      {showExoticPicker && (
        <ExoticPicker
          lockedExoticHash={lockedExoticHash}
          vendorItems={vendorItems}
          classType={classType}
          onSelected={(exotic) => {
            lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic });
            if (isExoticClassItemWithPerks(exotic)) {
              setShowExoticPerkPicker(true);
            }
          }}
          onClose={() => setShowExoticPicker(false)}
        />
      )}
      {showExoticPerkPicker && (
        <ExoticPerkPicker
          key={lockedExoticHash}
          lockedExoticHash={lockedExoticHash}
          initialPerks={perks}
          onSelected={({ removed, added }) => lbDispatch({ type: 'updatePerks', removed, added })}
          onClose={() => setShowExoticPerkPicker(false)}
        />
      )}
    </LoadoutEditSection>
  );
});

export default LoadoutOptimizerExotic;

function ChosenExoticOption({
  lockedExoticHash,
  onClick,
}: {
  lockedExoticHash: number | undefined;
  onClick: () => void;
}) {
  const defs = useD2Definitions()!;
  const itemCreationContext = useSelector(createItemContextSelector);

  let info: {
    icon: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    descriptionClassName?: string;
  };

  switch (lockedExoticHash) {
    case LOCKED_EXOTIC_NO_EXOTIC:
      info = {
        title: t('LoadoutBuilder.NoExotic'),
        description: t('LoadoutBuilder.NoExoticDescription'),
        icon: (
          <div className="item">
            <img src={noExoticIcon} className="item-img" />
          </div>
        ),
      };
      break;
    case LOCKED_EXOTIC_ANY_EXOTIC:
      info = {
        title: t('LoadoutBuilder.AnyExotic'),
        description: t('LoadoutBuilder.AnyExoticDescription'),
        icon: (
          <div className="item">
            <img src={anyExoticIcon} className="item-img" />
          </div>
        ),
      };
      break;
    case undefined: {
      info = {
        title: t('LoadoutBuilder.NoExoticPreference'),
        description: t('LoadoutBuilder.NoExoticPreferenceDescription'),
        icon: (
          <div className="item">
            <img src={noExoticPreferenceIcon} className="item-img" />
          </div>
        ),
      };
      break;
    }
    default: {
      const exoticArmor = defs.InventoryItem.get(lockedExoticHash);
      const fakeItem = makeFakeItem(itemCreationContext, exoticArmor.hash);
      if (fakeItem) {
        const { exoticPerk, exoticMods } = resolveExoticInfo(fakeItem);
        info = exoticTileInfo(defs, {
          def: exoticArmor,
          exoticPerk,
          exoticMods,
          isArmor1: Boolean(fakeItem?.energy),
        });
        break;
      }
      break;
    }
  }

  const { icon, title, description, descriptionClassName } = info!;

  return (
    <div className={styles.infoCard} onClick={onClick}>
      {icon}
      <div className={styles.details}>
        <div className={styles.title}>{title}</div>
        <div className={descriptionClassName}>{description}</div>
      </div>
    </div>
  );
}
