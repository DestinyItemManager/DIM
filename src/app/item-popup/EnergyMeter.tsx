import { EnergyMeterIncrements } from 'app/dim-ui/EnergyIncrements';
import { t } from 'app/i18next-t';
import { insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem } from 'app/inventory/item-types';
import { getEnergyUpgradeHashes, sumModCosts } from 'app/inventory/store/energy';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, disabledIcon, enabledIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { compareBy } from 'app/utils/comparators';
import { errorMessage } from 'app/utils/errors';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import Cost from 'app/vendors/Cost';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { AnimatePresence, Transition, Variants, motion } from 'motion/react';
import { useState } from 'react';
import styles from './EnergyMeter.m.scss';
import { SocketCategoryHeader } from './ItemSocketsGeneral';

const upgradeAnimateVariants: Variants = {
  shown: { height: 'auto', opacity: 1 },
  hidden: { height: 0, opacity: 0 },
};
const upgradeAnimateTransition: Transition<number> = { duration: 0.3 };

export default function EnergyMeter({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const energyCapacity = item.energy?.energyCapacity || 0;
  const [previewCapacity, setPreviewCapacity] = useState<number>(energyCapacity);
  const dispatch = useThunkDispatch();

  if (!item.energy) {
    return null;
  }

  const minCapacity = item.energy.energyCapacity;
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
    // eslint-disable-next-line no-alert
    if (!confirm('Pay the costs to upgrade?')) {
      return;
    }

    const upgradeMods = getEnergyUpgradeHashes(item, previewCapacity);
    const socket = getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier)!;

    try {
      for (const modHash of upgradeMods) {
        await dispatch(insertPlug(item, socket, modHash));
      }

      // TODO: show confirmation, hide preview, update item
    } catch (e) {
      showNotification({ type: 'error', title: 'Error', body: errorMessage(e) });
    }
  };

  return (
    defs && (
      <div className={styles.energyMeter}>
        <SocketCategoryHeader>
          <b>{Math.max(minCapacity, previewCapacity)}</b> <span>{t('EnergyMeter.Energy')}</span>
        </SocketCategoryHeader>
        <EnergyMeterIncrements
          energyCapacity={Math.max(minCapacity, previewCapacity || 0)}
          energyUsed={item.energy.energyUsed}
          minCapacity={minCapacity}
          variant="medium"
          previewUpgrade={previewUpgrade}
        />
        <AnimatePresence>
          {previewCapacity > minCapacity && (
            <motion.div
              className={styles.upgradePreview}
              initial="hidden"
              animate="shown"
              exit="hidden"
              variants={upgradeAnimateVariants}
              transition={upgradeAnimateTransition}
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

  const energyModHashes = getEnergyUpgradeHashes(item, previewCapacity);
  const costs = sumModCosts(
    defs,
    energyModHashes.map((h) => defs.InventoryItem.get(h)),
  ).sort(compareBy((c) => c.quantity));

  return (
    <>
      <span>
        {item.energy.energyCapacity} &rarr; {previewCapacity}
      </span>
      {costs.map((cost) => (
        <Cost key={cost.itemHash} cost={cost} className={styles.cost} />
      ))}
    </>
  );
}
