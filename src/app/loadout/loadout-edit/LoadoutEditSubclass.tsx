import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { storesSelector } from 'app/inventory/selectors';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getSubclassPlugs } from '../item-utils';
import EmptySubclass from '../loadout-ui/EmptySubclass';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './LoadoutEditSubclass.m.scss';
import { useEquipDropTargets } from './useEquipDropTargets';

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutEditSubclass({
  defs,
  subclass,
  classType,
  power,
  onRemove,
  onPick,
}: {
  defs: D2ManifestDefinitions;
  subclass?: ResolvedLoadoutItem;
  classType: DestinyClass;
  power: number;
  onRemove: () => void;
  onPick: () => void;
}) {
  const stores = useSelector(storesSelector);

  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => getSubclassPlugs(defs, subclass), [subclass, defs]);

  const acceptTarget = useMemo(
    () => [
      BucketHashes.Subclass.toString(),
      ...stores.flatMap((store) => `${store.id}-${BucketHashes.Subclass}`),
    ],
    [stores]
  );
  const { equippedRef, isOverEquipped, canDropEquipped } = useEquipDropTargets(
    acceptTarget,
    classType
  );

  return (
    <div
      ref={equippedRef}
      className={clsx(styles.subclassContainer, {
        [styles.isOver]: isOverEquipped,
        [styles.canDrop]: canDropEquipped,
      })}
    >
      <div className={styles.subclass}>
        {subclass ? (
          <ClosableContainer
            onClose={onRemove}
            showCloseIconOnHover
            className={clsx({
              [styles.missingItem]: subclass?.missing,
            })}
          >
            <ItemPopupTrigger item={subclass.item}>
              {(ref, onClick) => (
                <ConnectedInventoryItem
                  innerRef={ref}
                  // Disable the popup when plugs are available as we are showing
                  // plugs in the loadout and they may be different to the popup
                  onClick={plugs.length ? undefined : onClick}
                  item={subclass.item}
                  // don't show the selected Super ability because we are displaying the Super ability plug next
                  // to the subclass icon
                  hideSelectedSuper
                />
              )}
            </ItemPopupTrigger>
          </ClosableContainer>
        ) : (
          <button className={styles.classButton} type="button" onClick={onPick}>
            <EmptySubclass border />
          </button>
        )}
        {power !== 0 && (
          <div className={styles.power}>
            <AppIcon icon={powerActionIcon} />
            <span>{power}</span>
          </div>
        )}
      </div>
      {plugs.length ? (
        <div className={styles.subclassMods}>
          {plugs?.map((plug) => (
            <PlugDef
              key={getModRenderKey(plug)}
              plug={plug}
              forClassType={subclass?.item.classType}
            />
          ))}
        </div>
      ) : (
        <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
      )}
    </div>
  );
}
