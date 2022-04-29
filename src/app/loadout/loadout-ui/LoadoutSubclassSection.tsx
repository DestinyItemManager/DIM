import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { getDefaultAbilityChoiceHash, getSocketsByIndexes } from 'app/utils/socket-utils';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { createGetModRenderKey } from '../mod-utils';
import EmptySubclass from './EmptySubclass';
import styles from './LoadoutSubclassSection.m.scss';
import PlugDef from './PlugDef';

export function getSubclassPlugs(
  defs: D2ManifestDefinitions,
  subclass: ResolvedLoadoutItem | undefined
) {
  const plugs: {
    plug: PluggableInventoryItemDefinition;
    active: boolean;
    canBeEmptied: boolean;
  }[] = [];

  if (subclass?.item.sockets?.categories) {
    const aspects = subclass.item.sockets.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.Aspects
    );
    let activeFragments = _.sumBy(aspects?.socketIndexes, (aspectIndex) => {
      const override = subclass.loadoutItem.socketOverrides?.[aspectIndex];
      const def = override ? defs.InventoryItem.get(override) : undefined;

      return def?.plug?.energyCapacity?.capacityValue || 0;
    });

    for (const category of subclass.item.sockets.categories) {
      const showInitial =
        category.category.hash !== SocketCategoryHashes.Aspects &&
        category.category.hash !== SocketCategoryHashes.Fragments;
      const sockets = getSocketsByIndexes(subclass.item.sockets, category.socketIndexes);

      for (const socket of sockets) {
        const override = subclass.loadoutItem.socketOverrides?.[socket.socketIndex];
        const initial = getDefaultAbilityChoiceHash(socket);
        const hash = override || (showInitial && initial);
        const plug = hash && defs.InventoryItem.get(hash);
        if (plug && isPluggableItem(plug)) {
          const active =
            category.category.hash !== SocketCategoryHashes.Fragments || activeFragments-- > 0;
          plugs.push({ plug, active, canBeEmptied: !showInitial });
        }
      }
    }
  }

  return plugs;
}

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutSubclassSection({
  defs,
  subclass,
  power,
}: {
  defs: D2ManifestDefinitions;
  subclass?: ResolvedLoadoutItem;
  power: number;
}) {
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
                selectedSuperDisplay="disabled"
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
              className={clsx({ [styles.missingItem]: !plug.active })}
              tooltipWarning={!plug.active ? t('Loadouts.InsufficientFragmentCapacity') : ''}
              key={getModRenderKey(plug.plug)}
              plug={plug.plug}
            />
          ))}
        </div>
      ) : (
        <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
      )}
    </div>
  );
}
