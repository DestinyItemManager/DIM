import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { DimLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import React, { useMemo } from 'react';
import { createGetModRenderKey } from '../mod-utils';
import PlugDef from './PlugDef';
import styles from './Subclass.m.scss';

export function Subclass({
  defs,
  subclass,
  power,
}: {
  defs: D2ManifestDefinitions;
  subclass?: DimLoadoutItem;
  power: number;
}) {
  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => {
    const plugs: PluggableInventoryItemDefinition[] = [];

    if (subclass?.sockets?.categories) {
      for (const category of subclass.sockets.categories) {
        const showInitial =
          category.category.hash !== SocketCategoryHashes.Aspects &&
          category.category.hash !== SocketCategoryHashes.Fragments;
        const sockets = getSocketsByIndexes(subclass.sockets, category.socketIndexes);

        for (const socket of sockets) {
          const override = subclass.socketOverrides?.[socket.socketIndex];
          const initial = socket.socketDefinition.singleInitialItemHash;
          const hash = override || (showInitial && initial);
          const plug = hash && defs.InventoryItem.get(hash);
          if (plug && isPluggableItem(plug)) {
            plugs.push(plug);
          }
        }
      }
    }

    return plugs;
  }, [subclass, defs]);

  return (
    <div className={styles.subclassContainer}>
      <div className={styles.subclass}>
        {subclass ? (
          <ItemPopupTrigger item={subclass}>
            {(ref, onClick) => (
              <ConnectedInventoryItem
                innerRef={ref}
                // Disable the popup when plugs are available as we are showing
                // plugs in the loadout and they may be different to the popup
                onClick={plugs.length ? undefined : onClick}
                item={subclass}
                ignoreSelectedPerks
              />
            )}
          </ItemPopupTrigger>
        ) : (
          <EmptyClassItem />
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
            <PlugDef key={getModRenderKey(plug)} plug={plug} />
          ))}
        </div>
      ) : (
        <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
      )}
    </div>
  );
}

function EmptyClassItem() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect
        transform="rotate(-45)"
        y="17.470564"
        x="-16.470564"
        height="32.941124"
        width="32.941124"
        fill="rgba(255, 255, 255, 0.05)"
        strokeWidth="1"
        strokeMiterlimit="4"
      />
    </svg>
  );
}
