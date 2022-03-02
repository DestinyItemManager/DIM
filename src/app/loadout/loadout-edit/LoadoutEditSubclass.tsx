import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimLoadoutItem } from 'app/loadout/loadout-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import EmptySubclass from '../loadouts-page/EmptySubclass';
import { getSubclassPlugs } from '../loadouts-page/LoadoutSubclassSection';
import PlugDef from '../loadouts-page/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './LoadoutEditSubclass.m.scss';

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutEditSubclass({
  defs,
  subclass,
  power,
  onRemove,
  onPick,
}: {
  defs: D2ManifestDefinitions;
  subclass?: DimLoadoutItem;
  power: number;
  onRemove(): void;
  onPick(): void;
}) {
  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => getSubclassPlugs(defs, subclass), [subclass, defs]);

  return (
    <div className={styles.subclassContainer}>
      <div className={styles.subclass}>
        {subclass ? (
          <ClosableContainer
            onClose={onRemove}
            showCloseIconOnHover
            className={clsx({
              [styles.missingItem]: subclass?.owner === 'unknown',
            })}
          >
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
            <PlugDef key={getModRenderKey(plug)} plug={plug} />
          ))}
        </div>
      ) : (
        <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
      )}
    </div>
  );
}
