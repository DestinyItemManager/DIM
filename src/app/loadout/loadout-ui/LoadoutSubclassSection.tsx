import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  getDefaultAbilityChoiceHash,
  getSocketsByIndexes,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import { useMemo } from 'react';
import { createGetModRenderKey } from '../mod-utils';
import EmptySubclass from './EmptySubclass';
import styles from './LoadoutSubclassSection.m.scss';
import PlugDef from './PlugDef';

export function getSubclassPlugs(
  defs: D2ManifestDefinitions,
  subclass: ResolvedLoadoutItem | undefined
) {
  const plugs: PluggableInventoryItemDefinition[] = [];

  if (subclass?.item.sockets?.categories) {
    for (const category of subclass.item.sockets.categories) {
      const showInitial =
        !aspectSocketCategoryHashes.includes(category.category.hash) &&
        !fragmentSocketCategoryHashes.includes(category.category.hash);
      const sockets = getSocketsByIndexes(subclass.item.sockets, category.socketIndexes);

      for (const socket of sockets) {
        const override = subclass.loadoutItem.socketOverrides?.[socket.socketIndex];
        const initial = getDefaultAbilityChoiceHash(socket);
        const hash = override || (showInitial && initial);
        const plug = hash && defs.InventoryItem.get(hash);
        if (plug && isPluggableItem(plug)) {
          plugs.push(plug);
        }
      }
    }
  }

  return plugs;
}

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
