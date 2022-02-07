import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import React, { useMemo } from 'react';
import { getSubclassPlugs } from '../loadout-ui/LoadoutSubclassSection';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey } from '../mod-utils';
import styles from './LoadoutEditSubclass.m.scss';

/** The subclass section used in the loadouts page and drawer */
export default function LoadoutEditSubclass({
  defs,
  subclass,
  power,
  onRemove,
}: {
  defs: D2ManifestDefinitions;
  subclass?: DimLoadoutItem;
  power: number;
  onRemove(): void;
}) {
  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => getSubclassPlugs(defs, subclass), [subclass, defs]);

  return (
    <div className={styles.subclassContainer}>
      <div className={styles.subclass}>
        {subclass ? (
          <ClosableContainer onClose={onRemove} showCloseIconOnHover>
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
        stroke="white"
        strokeWidth="1"
        strokeMiterlimit="4"
      />
    </svg>
  );
}
