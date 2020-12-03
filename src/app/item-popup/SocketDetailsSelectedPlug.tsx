import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { insertPlug } from 'app/inventory/advanced-write-actions';
import {
  DimItem,
  DimPlug,
  DimSocket,
  DimStat,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { interpolateStatValue } from 'app/inventory/store/stats';
import { showNotification } from 'app/notifications/notifications';
import { refreshIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptySpecialtySocketHashes } from 'app/utils/item-utils';
import { StatHashes } from 'data/d2/generated-enums';
import { motion } from 'framer-motion';
import _ from 'lodash';
import React, { useState } from 'react';
import ItemStats from './ItemStats';
import { StatValue } from './PlugTooltip';
import { SocketDetailsMod } from './SocketDetails';
import styles from './SocketDetailsSelectedPlug.m.scss';

const costStatHashes = [
  StatHashes.AnyEnergyTypeCost,
  StatHashes.VoidCost,
  StatHashes.SolarCost,
  StatHashes.ArcCost,
];

export default function SocketDetailsSelectedPlug({
  plug,
  socket,
  defs,
  item,
  currentPlug,
  equippable,
  closeMenu,
}: {
  plug: PluggableInventoryItemDefinition;
  socket: DimSocket;
  defs: D2ManifestDefinitions;
  item: DimItem;
  currentPlug: DimPlug | null;
  equippable: boolean;
  closeMenu(): void;
}) {
  const dispatch = useThunkDispatch();

  const selectedPlugPerk =
    Boolean(plug.perks?.length) && defs.SandboxPerk.get(plug.perks[0].perkHash);

  const materialRequirementSet =
    (plug.plug.insertionMaterialRequirementHash &&
      defs.MaterialRequirementSet.get(plug.plug.insertionMaterialRequirementHash)) ||
    undefined;

  const sourceString =
    plug.collectibleHash && defs.Collectible.get(plug.collectibleHash)?.sourceString;

  const stats = _.compact(
    plug.investmentStats.map((stat) => {
      if (costStatHashes.includes(stat.statTypeHash)) {
        return null;
      }
      const itemStat = item.stats?.find((s) => s.statHash === stat.statTypeHash);
      if (!itemStat) {
        return null;
      }
      const statGroupDef = defs.StatGroup.get(
        defs.InventoryItem.get(item.hash).stats!.statGroupHash!
      );

      const statDisplay = statGroupDef?.scaledStats.find((s) => s.statHash === stat.statTypeHash);

      const currentModValue = currentPlug?.stats?.[stat.statTypeHash] || 0;

      // TODO: we should check the final computed stat against the result including and not including
      // conditinally active stats, and only include them if it lines up. There's not a way to figure
      // out if the conditions are met otherwise.
      if (stat.isConditionallyActive) {
        return null;
      }
      let modValue = stat.value;
      const updatedInvestmentValue = itemStat.investmentValue + modValue - currentModValue;
      let itemStatValue = updatedInvestmentValue;

      if (statDisplay) {
        itemStatValue = interpolateStatValue(updatedInvestmentValue, statDisplay);
        modValue =
          itemStatValue - interpolateStatValue(updatedInvestmentValue - modValue, statDisplay);
      }

      return {
        modValue,
        dimStat: {
          ...itemStat,
          value: itemStatValue,
        } as DimStat,
      };
    })
  );

  const [insertInProgress, setInsertInProgress] = useState(false);
  const onInsertPlug = async () => {
    setInsertInProgress(true);
    try {
      await dispatch(insertPlug(item, socket, plug.hash));
      closeMenu();
    } catch (e) {
      showNotification({ type: 'error', title: t('Sockets.InsertPlugError'), body: e.message });
    } finally {
      setInsertInProgress(false);
    }
  };

  const costs = materialRequirementSet?.materials.map((material) => {
    const materialDef = defs.InventoryItem.get(material.itemHash);
    return (
      materialDef &&
      material.count > 0 &&
      !material.omitFromRequirements && (
        <div className={styles.material} key={material.itemHash}>
          {material.count.toLocaleString()}
          <BungieImage
            src={materialDef.displayProperties.icon}
            title={materialDef.displayProperties.name}
          />
        </div>
      )
    );
  });

  return (
    <div className={styles.selectedPlug}>
      <div className={styles.modIcon}>
        <SocketDetailsMod itemDef={plug} defs={defs} />
        {!$featureFlags.awa && costs}
      </div>
      <div className={styles.modDescription}>
        <h3>
          {plug.displayProperties.name}
          {emptySpecialtySocketHashes.includes(plug.hash) && (
            <> &mdash; {plug.itemTypeDisplayName}</>
          )}
        </h3>
        {selectedPlugPerk ? (
          <div>{selectedPlugPerk.displayProperties.description}</div>
        ) : (
          plug.displayProperties.description && <div>{plug.displayProperties.description}</div>
        )}
        {sourceString && <div>{sourceString}</div>}
      </div>
      <div className={styles.modStats}>
        {stats.map((stat) => (
          <div className="plug-stats" key={stat.dimStat.statHash}>
            <StatValue value={stat.modValue} defs={defs} statHash={stat.dimStat.statHash} />
          </div>
        ))}
      </div>
      <ItemStats stats={stats.map((s) => s.dimStat)} className={styles.itemStats} />
      {$featureFlags.awa && (
        <motion.button
          layout
          type="button"
          className={styles.insertButton}
          onClick={onInsertPlug}
          disabled={!equippable || insertInProgress}
        >
          {insertInProgress && (
            <motion.span layout>
              <AppIcon icon={refreshIcon} spinning={true} />
            </motion.span>
          )}
          <motion.span layout>
            {t('Sockets.InsertModButton')}
            {costs}
          </motion.span>
        </motion.button>
      )}
    </div>
  );
}
