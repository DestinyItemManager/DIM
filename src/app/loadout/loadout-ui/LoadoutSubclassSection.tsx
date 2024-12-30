import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { PlugDefTooltip } from 'app/item-popup/PlugTooltip';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { useMemo } from 'react';
import { getSubclassPlugs } from '../loadout-item-utils';
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
  const superPlug = plugs.find((p) => p.socketCategoryHash === SocketCategoryHashes.Super);

  return (
    <div className={styles.subclassContainer}>
      <div
        className={clsx(styles.subclass, {
          [styles.missingItem]: subclass?.missing,
        })}
      >
        {subclass ? (
          <PressTip
            tooltip={() =>
              superPlug && (
                <PlugDefTooltip def={superPlug?.plug} classType={subclass?.item.classType} />
              )
            }
          >
            <DraggableInventoryItem item={subclass.item}>
              <ItemPopupTrigger
                item={subclass.item}
                extraData={{ socketOverrides: subclass.loadoutItem.socketOverrides }}
              >
                {(ref, onClick) => (
                  <ConnectedInventoryItem
                    ref={ref}
                    // Disable the popup when plugs are available as we are showing
                    // plugs in the loadout and they may be different to the popup
                    onClick={onClick}
                    item={subclass.item}
                  />
                )}
              </ItemPopupTrigger>
            </DraggableInventoryItem>
          </PressTip>
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
      )}
    </div>
  );
}
