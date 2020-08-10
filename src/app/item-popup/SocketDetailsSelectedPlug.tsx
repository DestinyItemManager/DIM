import React from 'react';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  D2Item,
  DimPlug,
  DimStat,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import _ from 'lodash';
import { interpolateStatValue } from 'app/inventory/store/stats';
import BungieImage from 'app/dim-ui/BungieImage';
import { StatValue } from './PlugTooltip';
import ItemStats from './ItemStats';
import styles from './SocketDetailsSelectedPlug.m.scss';
import { SocketDetailsMod } from './SocketDetails';
import { StatHashes } from 'data/d2/generated-enums';

const costStatHashes = [
  StatHashes.AnyEnergyTypeCost,
  StatHashes.VoidCost,
  StatHashes.SolarCost,
  StatHashes.ArcCost,
];

export default function SocketDetailsSelectedPlug({
  plug,
  defs,
  item,
  currentPlug,
}: {
  plug: PluggableInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  item: D2Item;
  currentPlug: DimPlug | null;
}) {
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

      const updatedInvestmentValue = itemStat.investmentValue + stat.value - currentModValue;
      let itemStatValue = updatedInvestmentValue;
      let modValue = stat.value;

      if (statDisplay) {
        itemStatValue = interpolateStatValue(updatedInvestmentValue, statDisplay);
        modValue =
          itemStatValue - interpolateStatValue(updatedInvestmentValue - stat.value, statDisplay);
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

  return (
    <div className={styles.selectedPlug}>
      <div className={styles.modIcon}>
        <SocketDetailsMod itemDef={plug} defs={defs} />
        {materialRequirementSet?.materials.map((material) => {
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
        })}
      </div>
      <div className={styles.modDescription}>
        <h3>{plug.displayProperties.name}</h3>
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
    </div>
  );
}
