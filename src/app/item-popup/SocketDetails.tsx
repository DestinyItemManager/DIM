import React, { useState, useRef, useEffect } from 'react';
import { DimSocket, D2Item, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import Sheet from 'app/dim-ui/Sheet';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  SocketPlugSources,
  TierType,
  DestinyInventoryItemDefinition,
  DestinyEnergyType,
  DestinyItemPlug,
  DestinyItemPlugBase,
} from 'bungie-api-ts/destiny2';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import { RootState } from 'app/store/types';
import { storesSelector, profileResponseSelector } from 'app/inventory/selectors';
import { connect } from 'react-redux';
import clsx from 'clsx';
import styles from './SocketDetails.m.scss';
import ElementIcon from 'app/inventory/ElementIcon';
import { compareBy, chainComparator, reverseComparator } from 'app/utils/comparators';
import { createSelector } from 'reselect';
import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import _ from 'lodash';
import SocketDetailsSelectedPlug from './SocketDetailsSelectedPlug';
import { emptySet } from 'app/utils/empty';
import { getModCostInfo } from 'app/collections/Mod';
import { isPluggableItem } from 'app/inventory/store/sockets';

interface ProvidedProps {
  item: D2Item;
  socket: DimSocket;
  initialSelectedPlug?: DestinyInventoryItemDefinition;
  onClose(): void;
}

interface StoreProps {
  defs: D2ManifestDefinitions;
  inventoryPlugs: Set<number>;
  unlockedPlugs: Set<number>;
}

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedPlugsSelector = createSelector(
    profileResponseSelector,
    (_: RootState, props: ProvidedProps) =>
      props.socket.socketDefinition.reusablePlugSetHash ||
      props.socket.socketDefinition.randomizedPlugSetHash,
    (profileResponse, plugSetHash) => {
      if (!plugSetHash || !profileResponse) {
        return emptySet<number>();
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

  const inventoryPlugs = createSelector(
    storesSelector,
    (_: RootState, props: ProvidedProps) => props.socket,
    (state: RootState) => state.manifest.d2Manifest!,
    (stores, socket, defs) => {
      const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
      if (
        !(
          socket.socketDefinition.plugSources & SocketPlugSources.InventorySourced &&
          socketType.plugWhitelist
        )
      ) {
        return emptySet<number>();
      }

      const modHashes = new Set<number>();

      const plugAllowList = new Set(socketType.plugWhitelist.map((e) => e.categoryHash));
      for (const store of stores) {
        for (const item of store.items) {
          const itemDef = defs.InventoryItem.get(item.hash);
          if (itemDef.plug && plugAllowList.has(itemDef.plug.plugCategoryHash)) {
            modHashes.add(item.hash);
          }
        }
      }

      return modHashes;
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    defs: state.manifest.d2Manifest!,
    inventoryPlugs: inventoryPlugs(state, props),
    unlockedPlugs: unlockedPlugsSelector(state, props),
  });
}

type Props = ProvidedProps & StoreProps;

/**
 * This is needed because canInsert is false if an items socket already contains the plug. In this
 * event insertFailIndexes will contain an index that comes from the Plug Definitions, indicating
 * that a similar mod is already inserted. Unfortunately these only have a message, which varies
 * based on region, and no hash or id.
 */
export function plugIsInsertable(plug: DestinyItemPlug | DestinyItemPlugBase) {
  return plug.canInsert || plug.insertFailIndexes.length;
}

function SocketDetails({
  defs,
  item,
  socket,
  initialSelectedPlug,
  unlockedPlugs,
  inventoryPlugs,
  onClose,
}: Props) {
  const initialPlug =
    (isPluggableItem(initialSelectedPlug) && initialSelectedPlug) || socket.plugged?.plugDef;
  const [selectedPlug, setSelectedPlug] = useState<PluggableInventoryItemDefinition | null>(
    initialPlug || null
  );

  const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
  const socketCategory = defs.SocketCategory.get(socketType.socketCategoryHash);

  // Start with the inventory plugs
  const modHashes = new Set<number>(inventoryPlugs);
  const otherUnlockedPlugs = new Set<number>();
  for (const modHash of inventoryPlugs) {
    otherUnlockedPlugs.add(modHash);
  }

  if (
    socket.socketDefinition.plugSources & SocketPlugSources.ReusablePlugItems &&
    socket.reusablePlugItems &&
    socket.reusablePlugItems.length
  ) {
    for (const plugItem of socket.reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
      if (plugIsInsertable(plugItem)) {
        otherUnlockedPlugs.add(plugItem.plugItemHash);
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

  const energyTypeHash = item.energy?.energyTypeHash;
  const energyType = energyTypeHash !== undefined && defs.EnergyType.get(energyTypeHash);

  let mods = Array.from(modHashes, (h) => defs.InventoryItem.get(h))
    .filter(
      (i) =>
        i.inventory!.tierType !== TierType.Common &&
        (!i.plug ||
          !i.plug.energyCost ||
          (energyType && i.plug.energyCost.energyTypeHash === energyType.hash) ||
          i.plug.energyCost.energyType === DestinyEnergyType.Any)
    )
    .filter(isPluggableItem)
    .sort(
      chainComparator(
        reverseComparator(
          compareBy((i) => unlockedPlugs.has(i.hash) || otherUnlockedPlugs.has(i.hash))
        ),
        compareBy((i) => i.plug?.energyCost?.energyCost),
        compareBy((i) => -i.inventory!.tierType),
        compareBy((i) => i.displayProperties.name)
      )
    );

  if (initialPlug) {
    mods = mods.filter((m) => m.hash !== initialPlug.hash);
    mods.unshift(initialPlug);
  }

  const requiresEnergy = mods.some((i) => i.plug?.energyCost?.energyCost);
  const initialItem =
    socket.socketDefinition.singleInitialItemHash &&
    defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
  const header = (
    <h1>
      {initialItem && (
        <BungieImage
          className={styles.categoryIcon}
          src={initialItem.displayProperties.icon}
          alt=""
        />
      )}
      {requiresEnergy && energyType && (
        <ElementIcon className={styles.energyElement} element={energyType} />
      )}
      <div>{socketCategory.displayProperties.name}</div>
    </h1>
  );

  // TODO: maybe show them like the perk browser, as a tile with names!

  const modListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (modListRef.current) {
      const firstElement = modListRef.current.querySelector("[tabIndex='0']")! as HTMLDivElement;
      firstElement?.focus();
    }
  }, []);

  const footer = selectedPlug && isPluggableItem(selectedPlug) && (
    <SocketDetailsSelectedPlug
      plug={selectedPlug}
      defs={defs}
      item={item}
      currentPlug={socket.plugged}
    />
  );

  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName={styles.socketDetailsSheet}
    >
      <div ref={modListRef} className={clsx('sub-bucket', styles.modList)}>
        {mods.map((mod) => (
          <SocketDetailsMod
            key={mod.hash}
            className={clsx(styles.clickableMod, {
              [styles.selected]: selectedPlug === mod,
              [styles.notUnlocked]:
                !unlockedPlugs.has(mod.hash) && !otherUnlockedPlugs.has(mod.hash),
            })}
            itemDef={mod}
            defs={defs}
            onClick={setSelectedPlug}
          />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(SocketDetails);

// TODO: use SVG! make a common icon component!
export const SocketDetailsMod = React.memo(
  ({
    itemDef,
    defs,
    className,
    onClick,
  }: {
    itemDef: PluggableInventoryItemDefinition;
    defs: D2ManifestDefinitions;
    className?: string;
    onClick?(mod: PluggableInventoryItemDefinition): void;
  }) => {
    const { energyCost, energyCostElementOverlay } = getModCostInfo(itemDef, defs);

    const onClickFn = onClick && (() => onClick(itemDef));

    return (
      <div
        role="button"
        className={clsx('item', className)}
        title={itemDef.displayProperties.name}
        onClick={onClickFn}
        onFocus={onClickFn}
        tabIndex={0}
      >
        <BungieImage className="item-img" src={itemDef.displayProperties.icon} />
        {energyCostElementOverlay && (
          <>
            <div
              style={{ backgroundImage: `url("${bungieNetPath(energyCostElementOverlay)}")` }}
              className="energyCostOverlay"
            />
            <div className="energyCost">{energyCost}</div>
          </>
        )}
      </div>
    );
  }
);
