import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getSubclassPlugs } from 'app/loadout-drawer/loadout-utils';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import { createGetModRenderKey } from '../mod-utils';
import EmptySubclass from './EmptySubclass';
import styles from './LoadoutSubclassSection.m.scss';
import PlugDef from './PlugDef';

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
