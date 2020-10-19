import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import styles from './EnergyMeter.m.scss';

export const energyStyles = {
  [DestinyEnergyType.Arc]: styles.arc,
  [DestinyEnergyType.Thermal]: styles.solar,
  [DestinyEnergyType.Void]: styles.void,
};

export default function EnergyMeter({
  defs,
  item,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
}) {
  const [energyCapacity, setEnergyCapacity] = useState(item.energy?.energyCapacity || 0);
  const [previewCapacity, setPreviewCapacity] = useState<number>();

  if (!item.energy) {
    return null;
  }
  const energyTypeHash = item.energy?.energyTypeHash;
  const energyType = (energyTypeHash !== undefined && defs.EnergyType.get(energyTypeHash)) || null;

  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array(10)
    .fill(styles.disabled)
    .fill(styles.unused, 0, Math.max(energyCapacity, previewCapacity || 0))
    .fill(styles.used, 0, item.energy.energyUsed);

  const onMouseOver = (i: number) => {
    setEnergyCapacity(Math.max(i, item.energy!.energyCapacity));
  };

  const onMouseOut = () => {
    setEnergyCapacity(item.energy!.energyCapacity);
  };

  const previewUpgrade = (i: number) => {
    setPreviewCapacity((pc) => (pc ? undefined : i));
  };

  const tierSockets = item.sockets!.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.ArmorTier
  )!;
  console.log(tierSockets.sockets);

  return (
    defs && (
      <div className={styles.energyMeter}>
        <div className="item-socket-category-name">
          <div>
            <b>{item.energy.energyCapacity}</b> <span>{t('EnergyMeter.Energy')}</span>
          </div>
        </div>
        <div className={clsx(styles.inner, energyStyles[item.energy.energyType])}>
          <ElementIcon className={styles.icon} element={energyType} />
          {meterIncrements.map((incrementStyle, i) => (
            <div
              key={i}
              className={clsx(styles.increments, incrementStyle, {
                [styles.clickable]: i + 1 > item.energy!.energyCapacity,
              })}
              onMouseOver={() => onMouseOver(i + 1)}
              onMouseOut={onMouseOut}
              onClick={() => previewUpgrade(i + 1)}
            />
          ))}
        </div>
        {previewCapacity && <div>Preview {previewCapacity}</div>}
      </div>
    )
  );
}
