import ElementIcon from 'app/dim-ui/ElementIcon';
import Select, { Option } from 'app/dim-ui/Select';
import { t } from 'app/i18next-t';
import { insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem } from 'app/inventory/item-types';
import { energyUpgrade, sumModCosts } from 'app/inventory/store/energy';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, disabledIcon, enabledIcon } from 'app/shell/icons';
import { ThunkDispatchProp } from 'app/store/types';
import Cost from 'app/vendors/Cost';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
  const energyCapacity = item.energy?.energyCapacity || 0;
  const energyType = item.energy?.energyType || DestinyEnergyType.Any;
  const [hoverEnergyCapacity, setHoverEnergyCapacity] = useState(0);
  const [previewCapacity, setPreviewCapacity] = useState<number>(energyCapacity);
  const [previewEnergyType, setPreviewEnergyType] = useState<DestinyEnergyType>(energyType);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  if (!item.energy) {
    return null;
  }

  const minCapacity = previewEnergyType === energyType ? energyCapacity : 1;

  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array(10)
    .fill(styles.disabled)
    .fill(
      styles.unused,
      0,
      previewEnergyType === energyType
        ? Math.max(energyCapacity, hoverEnergyCapacity || previewCapacity || 0)
        : Math.max(1, hoverEnergyCapacity || previewCapacity || 0)
    )
    .fill(styles.used, 0, previewEnergyType === energyType ? item.energy.energyUsed : 0);

  const onMouseOver = (i: number) => {
    setHoverEnergyCapacity(i);
  };

  const onMouseOut = () => {
    setHoverEnergyCapacity(0);
  };

  const previewUpgrade = (i: number) => {
    setPreviewCapacity(Math.max(minCapacity, i));
  };

  const onEnergyTypeChange = (value?: DestinyEnergyType | undefined) => {
    setPreviewEnergyType(value || DestinyEnergyType.Any);
  };

  const resetPreview = () => {
    setPreviewEnergyType(energyType);
    setPreviewCapacity(energyCapacity);
  };

  const applyChanges = async () => {
    if (!$featureFlags.awa) {
      return;
    }
    if (!item.energy) {
      return;
    }

    // TODO: i18n, maybe check to see if we have enough currency
    if (!confirm('Pay the costs to upgrade?')) {
      return;
    }

    const upgradeMods = energyUpgrade(
      defs,
      item,
      item.energy.energyType,
      item.energy.energyCapacity,
      previewEnergyType,
      previewCapacity
    );
    const tierSockets = item.sockets!.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.ArmorTier
    )!;

    const socket = tierSockets.sockets[0];

    try {
      for (const modHash of upgradeMods) {
        await dispatch(insertPlug(item, socket, modHash));
      }

      // TODO: show confirmation, hide preview, update item
    } catch (e) {
      showNotification({ type: 'error', title: 'Error', body: e.message });
    }
  };

  const energyTypes = Object.values(defs.EnergyType.getAll());

  const energyOptions: Option<DestinyEnergyType>[] = [
    DestinyEnergyType.Arc,
    DestinyEnergyType.Thermal,
    DestinyEnergyType.Void,
  ].map((e) => {
    const energyDef = energyTypes.find((ed) => ed.enumValue === e)!;
    return {
      key: e.toString(),
      value: e,
      content: (
        <span>
          <ElementIcon className={styles.icon} element={energyDef} />{' '}
          <span>{energyDef.displayProperties.name}</span>
        </span>
      ),
    };
  });

  const energyTypeDef = energyTypes.find((ed) => ed.enumValue === previewEnergyType)!;

  return (
    defs && (
      <div className={styles.energyMeter}>
        <div className="item-socket-category-name">
          <div>
            <b>{Math.max(minCapacity, previewCapacity)}</b> <span>{t('EnergyMeter.Energy')}</span>
          </div>
        </div>
        <div className={clsx(styles.inner, energyStyles[previewEnergyType])}>
          <Select<DestinyEnergyType>
            options={energyOptions}
            value={previewEnergyType}
            onChange={onEnergyTypeChange}
            hideSelected={true}
            className={styles.elementSelect}
          >
            <ElementIcon className={styles.icon} element={energyTypeDef} />
          </Select>
          {meterIncrements.map((incrementStyle, i) => (
            <div
              key={i}
              className={clsx(styles.increments, incrementStyle, {
                [styles.clickable]: i + 1 > energyCapacity,
              })}
              onMouseOver={() => onMouseOver(i + 1)}
              onMouseOut={onMouseOut}
              onClick={() => previewUpgrade(i + 1)}
            />
          ))}
        </div>
        <AnimatePresence>
          {(previewCapacity > minCapacity || previewEnergyType !== energyType) && (
            <motion.div
              className={styles.upgradePreview}
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { height: 'auto', opacity: 1 },
                collapsed: { height: 0, opacity: 0 },
              }}
              transition={{ duration: 0.3 }}
            >
              <EnergyUpgradePreview
                defs={defs}
                item={item}
                previewCapacity={previewCapacity || energyCapacity}
                previewEnergyType={previewEnergyType}
              />
              {$featureFlags.awa && (
                <button type="button" onClick={applyChanges} className={styles.upgradeButton}>
                  <AppIcon icon={enabledIcon} />
                </button>
              )}
              <button type="button" onClick={resetPreview} className={styles.upgradeButton}>
                <AppIcon icon={disabledIcon} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  );
}

function EnergyUpgradePreview({
  defs,
  item,
  previewCapacity,
  previewEnergyType,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  previewCapacity: number;
  previewEnergyType: DestinyEnergyType;
}) {
  if (!item.energy) {
    return null;
  }

  const energyModHashes = energyUpgrade(
    defs,
    item,
    item.energy.energyType,
    item.energy.energyCapacity,
    previewEnergyType,
    previewCapacity
  );

  const costs = sumModCosts(
    defs,
    energyModHashes.map((h) => defs.InventoryItem.get(h))
  );

  const energyTypes = Object.values(defs.EnergyType.getAll());
  const originalElement = energyTypes.find((ed) => ed.enumValue === item.energy?.energyType)!;
  const previewElement = energyTypes.find((ed) => ed.enumValue === previewEnergyType)!;

  return (
    <>
      <span>
        <ElementIcon element={originalElement} /> {item.energy.energyCapacity} &rarr;{' '}
        <ElementIcon element={previewElement} /> {previewCapacity}
      </span>
      {_.sortBy(costs, (c) => c.quantity).map((cost) => (
        <Cost key={cost.itemHash} cost={cost} defs={defs} className={styles.cost} />
      ))}
    </>
  );
}
