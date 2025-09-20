import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyClass, DestinyItemSubType } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
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
  perk1 = 0,
  perk2 = 0,
  vendorItems,
  lbDispatch,
}: {
  classType: DestinyClass;
  storeId: string;
  className?: string;
  lockedExoticHash: number | undefined;
  perk1: number;
  perk2: number;
  vendorItems: DimItem[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);
  const [showExoticPerkPicker, setShowExoticPerkPicker] = useState(false);
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  const handleClear = () => {
    lbDispatch({ type: 'removeLockedExotic' });
  };

  const handleSyncFromEquipped = () => {
    const equippedExotic = allItems.find(
      (i) => i.equipped && i.isExotic && i.bucket.inArmor && i.owner === storeId && i.energy,
    );
    lbDispatch({ type: 'lockExotic', lockedExoticHash: equippedExotic?.hash });
  };

  const handleRandomize = () => {
    const exotics = findLockableExotics(allItems, vendorItems, classType, defs);
    if (exotics.length > 0) {
      const randomExotic = sample(exotics);
      lbDispatch({ type: 'lockExotic', lockedExoticHash: randomExotic.def.hash });
    }
  };

  const handleClickEdit = () => setShowExoticPicker(true);
  const handleClickEditPerk = () => setShowExoticPerkPicker(true);

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.Exotic')}
      className={className}
      onClear={handleClear}
      onSyncFromEquipped={handleSyncFromEquipped}
      onRandomize={handleRandomize}
    >
      <ChosenExoticOption lockedExoticHash={lockedExoticHash} onClick={handleClickEdit} />
      <button type="button" className="dim-button" onClick={handleClickEdit}>
        {t('LB.SelectExotic')}
      </button>{' '}
      {lockedExoticHash !== undefined &&
        defs.InventoryItem.get(lockedExoticHash)?.itemSubType === DestinyItemSubType.ClassArmor && (
          <button type="button" className="dim-button" onClick={handleClickEditPerk}>
            {t('LB.SelectPerks')}
          </button>
        )}
      {showExoticPicker && (
        <ExoticPicker
          lockedExoticHash={lockedExoticHash}
          vendorItems={vendorItems}
          classType={classType}
          onSelected={(exotic) => {
            lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic });
            if (
              exotic &&
              defs.InventoryItem.get(exotic)?.itemSubType === DestinyItemSubType.ClassArmor
            ) {
              setShowExoticPerkPicker(true);
            }
          }}
          onClose={() => setShowExoticPicker(false)}
        />
      )}
      {showExoticPerkPicker && (
        <ExoticPerkPicker
          lockedExoticHash={lockedExoticHash}
          onSelected={(perk1, perk2) => lbDispatch({ type: 'lockExoticPerks', perk1, perk2 })}
          onClose={() => setShowExoticPerkPicker(false)}
        />
      )}
    </LoadoutEditSection>
  );
});

export default LoadoutOptimizerExotic;

function ChosenExoticOption({
  lockedExoticHash,
  perk1,
  perk2,
  onClick,
}: {
  lockedExoticHash: number | undefined;
  perk1: number | undefined;
  perk2: number | undefined;
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
        if (fakeItem.bucket.hash === BucketHashes.ClassArmor) {
          info.description = t('LoadoutBuilder.ExoticClassItemPerks');
          info.descriptionClassName = styles.warning;
        }
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
