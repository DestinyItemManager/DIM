import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { LockedExotic } from '../types';
import styles from './ExoticPicker.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  /** A list of item hashes for unlocked exotics. */
  availableExotics?: DimItem[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

/** A drawer to select an exotic for your build. */
function ExoticPicker({ defs, availableExotics, lbDispatch, onClose }: Props) {
  const lockableExotics: LockedExotic[] = [];

  if (availableExotics?.length) {
    const uniqueExotics = _.uniqBy(availableExotics, (item) => item.hash);

    for (const item of uniqueExotics) {
      const def = defs.InventoryItem.get(item.hash);

      if (def?.displayProperties.hasIcon) {
        lockableExotics.push({ def, bucketHash: item.bucket.hash });
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
          {lockableExotics.map(({ def, bucketHash }) => (
            <div
              key={def.hash}
              className={styles.defIcon}
              onClick={() => {
                lbDispatch({ type: 'lockExotic', def, bucketHash });
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
