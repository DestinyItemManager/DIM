import React, { useState } from 'react';
import { DimSocket, D2Item, DimPlug, DimStat } from 'app/inventory/item-types';
import Sheet from 'app/dim-ui/Sheet';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  SocketPlugSources,
  TierType,
  DestinyInventoryItemDefinition,
  DestinyEnergyType
} from 'bungie-api-ts/destiny2';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import { RootState } from 'app/store/reducers';
import { storesSelector, profileResponseSelector } from 'app/inventory/reducer';
import { DimStore } from 'app/inventory/store-types';
import { connect } from 'react-redux';
import clsx from 'clsx';
import styles from './SocketDetails.m.scss';
import { energyCapacityTypeNames } from './EnergyMeter';
import ElementIcon from 'app/inventory/ElementIcon';
import { compareBy, chainComparator, reverseComparator } from 'app/utils/comparators';
import { createSelector } from 'reselect';
import { itemsForPlugSet } from 'app/collections/PresentationNodeRoot';
import idx from 'idx';
import _ from 'lodash';
import { interpolateStatValue } from 'app/inventory/store/stats';
import { StatValue } from './PlugTooltip';
import ItemStats from './ItemStats';

interface ProvidedProps {
  item: D2Item;
  socket: DimSocket;
  onClose(): void;
}

interface StoreProps {
  defs: D2ManifestDefinitions;
  stores: DimStore[];
  unlockedPlugs: Set<number>;
}

const EMPTY_SET = new Set<number>();

/** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
const unlockedPlugsSelector = createSelector(
  profileResponseSelector,
  (_: RootState, props: ProvidedProps) =>
    props.socket.socketDefinition.reusablePlugSetHash ||
    props.socket.socketDefinition.randomizedPlugSetHash,
  (profileResponse, plugSetHash) => {
    if (!plugSetHash || !profileResponse) {
      return EMPTY_SET;
    }
    const unlockedPlugs = new Set<number>();
    const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
    for (const plugSetItem of plugSetItems) {
      if (plugSetItem.enabled) {
        unlockedPlugs.add(plugSetItem.plugItemHash);
      }
    }
    return unlockedPlugs;
  }
);

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    defs: state.manifest.d2Manifest!,
    stores: storesSelector(state),
    unlockedPlugs: unlockedPlugsSelector(state, props)
  };
}

type Props = ProvidedProps & StoreProps;

function SocketDetails({ defs, item, socket, stores, unlockedPlugs, onClose }: Props) {
  const [selectedPlug, setSelectedPlug] = useState<DestinyInventoryItemDefinition | null>(
    (socket.plug && socket.plug.plugItem) || null
  );

  const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
  const socketCategory = defs.SocketCategory.get(socketType.socketCategoryHash);

  const energyType = item.energy && item.energy.energyType;
  const energyCapacityElement =
    (item.energy && energyCapacityTypeNames[item.energy.energyType]) || null;

  // TODO: move this stuff into mapStateToProps - maybe even individually

  const otherUnlockedPlugs = new Set<number>();
  const modHashes = new Set<number>();

  if (
    socket.socketDefinition.plugSources & SocketPlugSources.ReusablePlugItems &&
    socket.reusablePlugItems &&
    socket.reusablePlugItems.length
  ) {
    for (const plugItem of socket.reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
      if (plugItem.canInsert) {
        otherUnlockedPlugs.add(plugItem.plugItemHash);
      }
    }
  }

  if (
    socket.socketDefinition.plugSources & SocketPlugSources.InventorySourced &&
    socketType.plugWhitelist
  ) {
    const plugWhitelist = new Set(socketType.plugWhitelist.map((e) => e.categoryHash));
    for (const store of stores) {
      for (const item of store.items) {
        const itemDef = defs.InventoryItem.get(item.hash);
        if (itemDef.plug && plugWhitelist.has(itemDef.plug.plugCategoryHash)) {
          modHashes.add(item.hash);
          otherUnlockedPlugs.add(item.hash);
        }
      }
    }
  }

  if (socket.socketDefinition.reusablePlugSetHash) {
    for (const plugItem of defs.PlugSet.get(socket.socketDefinition.reusablePlugSetHash)
      .reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
    }
  }
  if (socket.socketDefinition.randomizedPlugSetHash) {
    for (const plugItem of defs.PlugSet.get(socket.socketDefinition.randomizedPlugSetHash)
      .reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
    }
  }

  let mods = Array.from(modHashes)
    .map((h) => defs.InventoryItem.get(h))
    .filter(
      (i) =>
        i.inventory.tierType !== TierType.Common &&
        (!i.plug ||
          !i.plug.energyCost ||
          (i.plug.energyCost.energyType === energyType ||
            i.plug.energyCost.energyType === DestinyEnergyType.Any))
    )
    .sort(
      chainComparator(
        reverseComparator(
          compareBy((i) => unlockedPlugs.has(i.hash) || otherUnlockedPlugs.has(i.hash))
        ),
        compareBy((i) => i.plug && i.plug.energyCost && i.plug.energyCost.energyCost),
        compareBy((i) => -i.inventory.tierType),
        compareBy((i) => i.displayProperties.name)
      )
    );

  if (socket.plug && socket.plug.plugItem) {
    mods = mods.filter((m) => m.hash !== socket.plug!.plugItem.hash);
    mods.unshift(socket.plug.plugItem);
  }

  const requiresEnergy = mods.some(
    (i) => i.plug && i.plug.energyCost && i.plug.energyCost.energyCost
  );
  const initialItem = defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
  const header = (
    <h1>
      {initialItem && (
        <BungieImage
          className={styles.categoryIcon}
          src={initialItem.displayProperties.icon}
          alt=""
        />
      )}
      {requiresEnergy && energyCapacityElement && (
        <ElementIcon className={styles.energyElement} element={energyCapacityElement} />
      )}
      <div>{socketCategory.displayProperties.name}</div>
    </h1>
  );

  // TODO: maybe show them like the perk browser, as a tile with names!

  const footer = selectedPlug && (
    <SelectedPlug plug={selectedPlug} defs={defs} item={item} currentPlug={socket.plug} />
  );

  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName={styles.socketDetailsSheet}
    >
      <div className={clsx('sub-bucket', styles.modList)}>
        {mods.map((mod) => (
          <Mod
            key={mod.hash}
            className={clsx({
              [styles.selected]: selectedPlug === mod,
              [styles.notUnlocked]:
                !unlockedPlugs.has(mod.hash) && !otherUnlockedPlugs.has(mod.hash)
            })}
            itemDef={mod}
            defs={defs}
            onClick={() => setSelectedPlug(mod)}
          />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(SocketDetails);

// TODO: use SVG!
function Mod({
  itemDef,
  defs,
  className,
  onClick
}: {
  itemDef: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  className?: string;
  onClick?(): void;
}) {
  const energyTypeHash = idx(itemDef, (i) => i.plug.energyCost.energyTypeHash);
  const energyType = energyTypeHash && defs.EnergyType.get(energyTypeHash);
  const energyCostStat = energyType && defs.Stat.get(energyType.costStatHash);
  const costElementIcon = energyCostStat && energyCostStat.displayProperties.icon;

  return (
    <div
      className={clsx('item', className)}
      title={itemDef.displayProperties.name}
      onClick={onClick}
    >
      <BungieImage className="item-img" src={itemDef.displayProperties.icon} />
      {costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url(${bungieNetPath(costElementIcon)}` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{itemDef.plug.energyCost.energyCost}</div>
        </>
      )}
    </div>
  );
}

function SelectedPlug({
  plug,
  defs,
  item,
  currentPlug
}: {
  plug: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  item: D2Item;
  currentPlug: DimPlug | null;
}) {
  const selectedPlugPerk =
    (plug.perks && plug.perks.length > 0 && defs.SandboxPerk.get(plug.perks[0].perkHash)) ||
    undefined;

  const costStatHashes = [3578062600, 2399985800, 3344745325, 3779394102];

  const materialRequirementSet =
    (plug.plug.insertionMaterialRequirementHash &&
      defs.MaterialRequirementSet.get(plug.plug.insertionMaterialRequirementHash)) ||
    undefined;

  const stats = _.compact(
    plug.investmentStats.map((stat) => {
      if (costStatHashes.includes(stat.statTypeHash)) {
        return null;
      }
      const itemStat = item.stats && item.stats.find((s) => s.statHash === stat.statTypeHash);
      if (!itemStat) {
        return null;
      }
      // const statDef = defs.Stat.get(stat.statTypeHash);
      const statGroupDef = defs.StatGroup.get(
        defs.InventoryItem.get(item.hash).stats.statGroupHash!
      );

      const statDisplay =
        statGroupDef && statGroupDef.scaledStats.find((s) => s.statHash === stat.statTypeHash);

      const currentModValue =
        (currentPlug && currentPlug.stats && currentPlug.stats[stat.statTypeHash]) || 0;

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
          value: itemStatValue
        } as DimStat
      };
    })
  );

  return (
    <div className={styles.selectedPlug}>
      <div className={styles.modIcon}>
        <Mod itemDef={plug} defs={defs} />
        {materialRequirementSet &&
          materialRequirementSet.materials.map((material) => {
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
