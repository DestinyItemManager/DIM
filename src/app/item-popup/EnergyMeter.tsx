import 'app/dim-ui/EnergyMeterIncrements.scss';
import { t } from 'app/i18next-t';
import { insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem } from 'app/inventory/item-types';
import { energyUpgrade, sumModCosts } from 'app/inventory/store/energy';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, disabledIcon, enabledIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import Cost from 'app/vendors/Cost';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import { useState } from 'react';
import styles from './EnergyMeter.m.scss';

export default function EnergyMeter({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const energyCapacity = item.energy?.energyCapacity || 0;
  const [hoverEnergyCapacity, setHoverEnergyCapacity] = useState(0);
  const [previewCapacity, setPreviewCapacity] = useState<number>(energyCapacity);
  const dispatch = useThunkDispatch();

  if (!item.energy) {
    return null;
  }

  const minCapacity = item.energy.energyCapacity;

  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array<string>(10)
    .fill('unavailable')
    .fill('unused', 0, Math.max(minCapacity, hoverEnergyCapacity || previewCapacity || 0))
    .fill('used', 0, item.energy.energyUsed);

  const onMouseOver = (i: number) => setHoverEnergyCapacity(i);
  const onMouseOut = () => setHoverEnergyCapacity(0);
  const previewUpgrade = (i: number) => setPreviewCapacity(Math.max(minCapacity, i));
  const resetPreview = () => setPreviewCapacity(energyCapacity);

  const applyChanges = async () => {
    if (!$featureFlags.awa) {
      return;
    }
    if (!item.energy || !item.sockets) {
      return;
    }

    // TODO: i18n, maybe check to see if we have enough currency
    if (!confirm('Pay the costs to upgrade?')) {
      return;
    }

    const upgradeMods = energyUpgrade(item, previewCapacity);
    const socket = getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier)!;

    try {
      for (const modHash of upgradeMods) {
        await dispatch(insertPlug(item, socket, modHash));
      }

      // TODO: show confirmation, hide preview, update item
    } catch (e) {
      showNotification({ type: 'error', title: 'Error', body: e.message });
    }
  };

  return (
    defs && (
      <div className={styles.energyMeter}>
        <div className="item-socket-category-name">
          <div>
            <b>{Math.max(minCapacity, previewCapacity)}</b> <span>{t('EnergyMeter.Energy')}</span>
          </div>
        </div>
        <div className={clsx('energyMeterIncrements', 'medium')}>
          {meterIncrements.map((incrementStyle, i) => (
            <div
              key={i}
              className={clsx(incrementStyle, {
                [styles.clickable]: i + 1 > energyCapacity,
              })}
              onMouseOver={() => onMouseOver(i + 1)}
              onMouseOut={onMouseOut}
              onClick={() => previewUpgrade(i + 1)}
            />
          ))}
        </div>
        <AnimatePresence>
          {previewCapacity > minCapacity && (
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
                item={item}
                previewCapacity={previewCapacity || energyCapacity}
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
  item,
  previewCapacity,
}: {
  item: DimItem;
  previewCapacity: number;
}) {
  const defs = useD2Definitions()!;
  if (!item.energy) {
    return null;
  }

  const energyModHashes = energyUpgrade(item, previewCapacity);
  const costs = sumModCosts(
    defs,
    energyModHashes.map((h) => defs.InventoryItem.get(h))
  );

  return (
    <>
      <span>
        {item.energy.energyCapacity} &rarr; {previewCapacity}
      </span>
      {_.sortBy(costs, (c) => c.quantity).map((cost) => (
        <Cost key={cost.itemHash} cost={cost} className={styles.cost} />
      ))}
    </>
  );
}
