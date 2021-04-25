import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './ExoticPicker.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  /** A list of item hashes for unlocked exotics. */
  exoticHashes?: number[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

/** A drawer to select an exotic for your build. */
function ExoticPicker({ defs, exoticHashes, lbDispatch, onClose }: Props) {
  const visibleDefs: DestinyInventoryItemDefinition[] = [];

  if (exoticHashes?.length) {
    for (const hash of exoticHashes) {
      const def = defs.InventoryItem.get(hash);

      if (def?.displayProperties.hasIcon) {
        visibleDefs.push(def);
      }
    }
  }

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.SelectExotic')}</h1>
        </div>
      }
      onClose={onClose}
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className={styles.container}>
          {visibleDefs.map((def) => (
            <div
              key={def.hash}
              className={styles.defIcon}
              onClick={() => {
                lbDispatch({ type: 'lockExotic', def });
                onClose();
              }}
            >
              <DefItemIcon itemDef={def} />
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default ExoticPicker;
