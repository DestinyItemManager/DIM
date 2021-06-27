import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { UpgradeMaterialHashes } from 'app/search/d2-known-values';
import { useSetSetting } from 'app/settings/hooks';
import { UpgradeSpendTier } from 'app/settings/initial-settings';
import clsx from 'clsx';
import React, { ReactNode, useMemo } from 'react';
import styles from './ArmorUpgradePicker.m.scss';

function UpgradeOption({ name, icon, details }: { name: string; icon?: string; details: string }) {
  return (
    <div className={styles.upgradeOption}>
      <div className={styles.itemName}>{name}</div>
      <div className={styles.itemDetails}>
        {icon && <BungieImage className={styles.itemImage} src={icon} />}
        <div>{details}</div>
      </div>
    </div>
  );
}

function getDisplayProperties(
  defs: D2ManifestDefinitions,
  upgradeSpendTier: UpgradeSpendTier
): { name: string; icon?: string } {
  const ascendantShardDisplay = defs.InventoryItem.get(
    UpgradeMaterialHashes.ascendantShard
  ).displayProperties;
  switch (upgradeSpendTier) {
    case UpgradeSpendTier.Nothing:
      return { name: t('LoadoutBuilder.NoUpgrades') };
    case UpgradeSpendTier.LegendaryShards: {
      return defs.InventoryItem.get(UpgradeMaterialHashes.legendaryShard).displayProperties;
    }
    case UpgradeSpendTier.EnhancementPrisms: {
      return defs.InventoryItem.get(UpgradeMaterialHashes.enhancementPrism).displayProperties;
    }
    case UpgradeSpendTier.AscendantShardsNotExotic: {
      return {
        name: t('LoadoutBuilder.NotExotics', { material: ascendantShardDisplay.name }),
        icon: ascendantShardDisplay.icon,
      };
    }
    case UpgradeSpendTier.AscendantShardsNotMasterworked: {
      return {
        name: t('LoadoutBuilder.NotMasterworked', { material: ascendantShardDisplay.name }),
        icon: ascendantShardDisplay.icon,
      };
    }
    case UpgradeSpendTier.AscendantShards: {
      return ascendantShardDisplay;
    }
  }
}

export function SelectedArmorUpgrade({
  defs,
  upgradeSpendTier,
  lockItemEnergyType,
}: {
  defs: D2ManifestDefinitions;
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
}) {
  const { name, icon } = getDisplayProperties(defs, upgradeSpendTier);
  const displayName = lockItemEnergyType ? `${name} + ${t('LoadoutBuilder.LockElement')}` : name;
  return (
    <div className={styles.selectedUpgradeOption}>
      {icon && <BungieImage src={icon} />}
      <div>{displayName}</div>
    </div>
  );
}

/** A drawer to select an exotic for your build. */
function ArmorUpgradePicker({
  currentUpgradeSpendTier,
  lockItemEnergyType,
  onClose,
}: {
  currentUpgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
  onClose(): void;
}) {
  const defs = useD2Definitions()!;
  const setSetting = useSetSetting();

  const upgradeOptions: { value: UpgradeSpendTier; content: ReactNode }[] = useMemo(() => {
    const legendaryShardDisplay = getDisplayProperties(defs, UpgradeSpendTier.LegendaryShards);
    const enhancementPrismDisplay = getDisplayProperties(defs, UpgradeSpendTier.EnhancementPrisms);
    const notExoticDisplay = getDisplayProperties(defs, UpgradeSpendTier.AscendantShardsNotExotic);
    const notMasterworkedDisplay = getDisplayProperties(
      defs,
      UpgradeSpendTier.AscendantShardsNotMasterworked
    );
    const ascendantShardDisplay = getDisplayProperties(defs, UpgradeSpendTier.AscendantShards);

    return [
      {
        value: UpgradeSpendTier.Nothing,
        content: (
          <UpgradeOption
            name={getDisplayProperties(defs, UpgradeSpendTier.Nothing).name}
            details={t('LoadoutBuilder.NoUpgradesDetails')}
          />
        ),
      },
      {
        value: UpgradeSpendTier.LegendaryShards,
        content: (
          <UpgradeOption
            name={legendaryShardDisplay.name}
            icon={legendaryShardDisplay.icon}
            details={t('LoadoutBuilder.LegendaryShardsAndEnhancementPrismDetails', {
              energyLevel: 7, // todo (ryanr) generate or obtain this programatically
            })}
          />
        ),
      },
      {
        value: UpgradeSpendTier.EnhancementPrisms,
        content: (
          <UpgradeOption
            name={enhancementPrismDisplay.name}
            icon={enhancementPrismDisplay.icon}
            details={t('LoadoutBuilder.LegendaryShardsAndEnhancementPrismDetails', {
              energyLevel: 9,
            })}
          />
        ),
      },
      {
        value: UpgradeSpendTier.AscendantShardsNotExotic,
        content: (
          <UpgradeOption
            name={notExoticDisplay.name}
            icon={notExoticDisplay.icon}
            details={t('LoadoutBuilder.AscendantShardNotExoticDetails', { energyLevel: 9 })}
          />
        ),
      },
      {
        value: UpgradeSpendTier.AscendantShardsNotMasterworked,
        content: (
          <UpgradeOption
            name={notMasterworkedDisplay.name}
            icon={notMasterworkedDisplay.icon}
            details={t('LoadoutBuilder.AscendantShardNotMasterworkedDetails')}
          />
        ),
      },
      {
        value: UpgradeSpendTier.AscendantShards,
        content: (
          <UpgradeOption
            name={ascendantShardDisplay.name}
            icon={ascendantShardDisplay.icon}
            details={t('LoadoutBuilder.AscendantShardDetails')}
          />
        ),
      },
    ];
  }, [defs]);

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LoadoutBuilder.SelectAssumedArmorUpgrade')}</h1>
          <div>{t('LoadoutBuilder.SelectAssumedArmorUpgradeDescription')}</div>
        </div>
      }
      onClose={onClose}
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className={styles.container}>
          <div className={styles.modifiers}>
            <CheckButton
              name="lo-lock-item-energy-type"
              className={styles.lockEnergyType}
              checked={lockItemEnergyType}
              onChange={(checked) => setSetting('loLockItemEnergyType', checked)}
            >
              {t('LoadoutBuilder.LockElement')}
            </CheckButton>
          </div>
          <div className={styles.items}>
            {upgradeOptions.map((option) => (
              <div
                className={clsx(styles.itemContainer, {
                  [styles.selected]: currentUpgradeSpendTier === option.value,
                })}
                key={option.value}
                onClick={() => {
                  setSetting('loUpgradeSpendTier', option.value);
                  onClose();
                }}
              >
                {option.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

export default ArmorUpgradePicker;
