import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, storesSelector } from 'app/inventory/selectors';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { getSubclassPlugs } from '../loadout-item-utils';
import {
  SubclassContainer,
  SubclassIcon,
  SubclassMods,
} from '../loadout-ui/LoadoutSubclassSection';
import * as styles from './LoadoutEditSubclass.m.scss';
import { useEquipDropTargets } from './useEquipDropTargets';

// Selector to get all subclass items for a given class type and store ID. This
// gets cached across components.
const subclassItemsSelector = createSelector(
  allItemsSelector,
  (_state: unknown, classType: DestinyClass) => classType,
  (_state: unknown, _classType: DestinyClass, storeId: string) => storeId,
  (allItems, classType, storeId) =>
    allItems
      .filter(
        (item) =>
          item.bucket.hash === BucketHashes.Subclass &&
          item.classType === classType &&
          item.owner === storeId &&
          itemCanBeInLoadout(item),
      )
      .sort(compareBy((i) => i.element?.enumValue)),
);

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutEditSubclass({
  subclass,
  classType,
  storeId,
  power,
  onPick,
  onClick,
}: {
  subclass?: ResolvedLoadoutItem;
  classType: DestinyClass;
  storeId: string;
  power: number;
  onClick: () => void;
  onPick: (item: DimItem) => void;
}) {
  const defs = useD2Definitions()!;
  const stores = useSelector(storesSelector);
  const subclassItems = useSelector((state: RootState) =>
    subclassItemsSelector(state, classType, storeId),
  );

  const plugs = useMemo(() => getSubclassPlugs(defs, subclass), [subclass, defs]);

  const acceptTarget = useMemo(
    () => [
      BucketHashes.Subclass.toString(),
      ...stores.flatMap((store) => `${store.id}-${BucketHashes.Subclass}`),
    ],
    [stores],
  );
  const { equippedRef, isOverEquipped, canDropEquipped } = useEquipDropTargets(
    acceptTarget,
    classType,
  );

  return (
    <SubclassContainer
      ref={(el) => {
        equippedRef(el);
      }}
      className={clsx({
        [styles.isOver]: isOverEquipped,
        [styles.canDrop]: canDropEquipped,
      })}
      onClick={subclass ? onClick : undefined}
      role={subclass ? 'button' : undefined}
    >
      {subclass ? (
        <>
          <SubclassIcon subclass={subclass} plugs={plugs} power={power} />
          <SubclassMods subclass={subclass} plugs={plugs} />
        </>
      ) : (
        // When no subclass is selected, show all subclasses and let the user choose.
        subclassItems.map((item) => (
          <button
            key={item.index}
            className={styles.classButton}
            type="button"
            onClick={() => onPick(item)}
            title={t('Loadouts.ChooseItem', { name: t('Bucket.Class') })}
          >
            <ConnectedInventoryItem item={item} hideSelectedSuper />
          </button>
        ))
      )}
    </SubclassContainer>
  );
}
