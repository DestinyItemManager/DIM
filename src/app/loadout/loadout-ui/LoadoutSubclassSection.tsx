import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { useMemo } from 'react';
import { getSubclassPlugs } from '../item-utils';
import { createGetModRenderKey } from '../mod-utils';
import EmptySubclass from './EmptySubclass';
import styles from './LoadoutSubclassSection.m.scss';
import PlugDef from './PlugDef';

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutSubclassSection({
  subclass,
  power,
}: {
  subclass?: ResolvedLoadoutItem;
  power: number;
}) {
  const defs = useD2Definitions()!;
  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => getSubclassPlugs(defs, subclass), [subclass, defs]);

  return (
    <div className={styles.subclassContainer}>
      <div
        className={clsx(styles.subclass, {
          [styles.missingItem]: subclass?.missing,
        })}
      >
        {subclass ? (
          <DraggableInventoryItem item={subclass.item}>
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
          </DraggableInventoryItem>
        ) : (
          <EmptySubclass />
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
