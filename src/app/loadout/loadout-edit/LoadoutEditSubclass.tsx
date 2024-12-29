import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, storesSelector } from 'app/inventory/selectors';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { compareBy } from 'app/utils/comparators';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getSubclassPlugs } from '../loadout-item-utils';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './LoadoutEditSubclass.m.scss';
import { useEquipDropTargets } from './useEquipDropTargets';

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
  const allItems = useSelector(allItemsSelector);

  const subclassItemFilter = (item: DimItem) =>
    item.bucket.hash === BucketHashes.Subclass &&
    item.classType === classType &&
    item.owner === storeId &&
    itemCanBeInLoadout(item);

  const subclassItems = allItems
    .filter(subclassItemFilter)
    .sort(compareBy((i) => i.element?.enumValue));

  const getModRenderKey = createGetModRenderKey();
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
    <div
      ref={(el) => {
        equippedRef(el);
      }}
      className={clsx(styles.subclassContainer, {
        [styles.isOver]: isOverEquipped,
        [styles.canDrop]: canDropEquipped,
      })}
      onClick={subclass ? onClick : undefined}
    >
      {!subclass && subclassItems.length > 0 && (
        <>
          {subclassItems.map((item) => (
            <button
              key={item.index}
              className={styles.classButton}
              type="button"
              onClick={() => onPick(item)}
              title={t('Loadouts.ChooseItem', { name: t('Bucket.Class') })}
            >
              <ConnectedInventoryItem item={item} hideSelectedSuper />
            </button>
          ))}
        </>
      )}
      {subclass && (
        <div className={styles.subclass}>
          <div
            className={clsx({
              [styles.missingItem]: subclass?.missing,
            })}
          >
            <ItemPopupTrigger item={subclass.item}>
              {(ref, onClick) => (
                <ConnectedInventoryItem
                  ref={ref}
                  // Disable the popup when plugs are available as we are showing
                  // plugs in the loadout and they may be different to the popup
                  onClick={plugs.length ? undefined : onClick}
                  item={subclass.item}
                />
              )}
            </ItemPopupTrigger>
          </div>
          {power !== 0 && (
            <div className={styles.power}>
              <AppIcon icon={powerActionIcon} />
              <span>{power}</span>
            </div>
          )}
        </div>
      )}
      {subclass &&
        (plugs.length ? (
          <div className={styles.subclassMods}>
            {plugs?.map(
              (plug) =>
                plug.socketCategoryHash !== SocketCategoryHashes.Super && (
                  <PlugDef
                    key={getModRenderKey(plug.plug)}
                    plug={plug.plug}
                    forClassType={subclass?.item.classType}
                  />
                ),
            )}
          </div>
        ) : (
          <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
        ))}
    </div>
  );
}
