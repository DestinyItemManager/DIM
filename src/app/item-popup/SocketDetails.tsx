import { languageSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory-item/ItemIcon';
import {
  DimItem,
  DimSocket,
  PluggableInventoryItemDefinition,
} from 'app/inventory-stores/item-types';
import { allItemsSelector, profileResponseSelector } from 'app/inventory-stores/selectors';
import { isPluggableItem } from 'app/inventory-stores/store/sockets';
import { d2ManifestSelector, useD2Definitions } from 'app/manifest/selectors';
import { unlockedItemsForCharacterOrProfilePlugSet } from 'app/records/plugset-helpers';
import { collectionsVisibleShadersSelector } from 'app/records/selectors';
import { createPlugSearchPredicate } from 'app/search/plug-search';
import { SearchInput } from 'app/search/SearchInput';
import { RootState } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptySet } from 'app/utils/empty';
import {
  DestinyEnergyType,
  DestinyItemPlug,
  DestinyItemPlugBase,
  SocketPlugSources,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import '../inventory-page/StoreBucket.scss';
import styles from './SocketDetails.m.scss';
import SocketDetailsSelectedPlug from './SocketDetailsSelectedPlug';

interface ProvidedProps {
  item: DimItem;
  socket: DimSocket;
  /** Set to true if you want to insert the plug when it's selected, rather than returning it. */
  allowInsertPlug: boolean;
  onClose(): void;
  onPlugSelected?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}

interface StoreProps {
  inventoryPlugs: Set<number>;
  unlockedPlugs: Set<number>;
  /** if not undefined, hide locked plugs not in this set */
  shownLockedPlugs?: Set<number>;
}

function mapStateToProps() {
  /**
   * Build a set of the inventory item hashes of all plug items in the socket's
   * plug set that are unlocked by this character.
   */
  const unlockedPlugsSelector = createSelector(
    profileResponseSelector,
    (_state: RootState, { item }: ProvidedProps) => item.owner,
    (_state: RootState, { socket }: ProvidedProps) =>
      socket.socketDefinition.reusablePlugSetHash || socket.socketDefinition.randomizedPlugSetHash,
    (profileResponse, owner, plugSetHash) => {
      if (!plugSetHash || !profileResponse) {
        return emptySet<number>();
      }
      return unlockedItemsForCharacterOrProfilePlugSet(profileResponse, plugSetHash, owner);
    }
  );

  /** Build a set of items that should be shown even if locked. If undefined, show all.
   * This is a heuristic only, which is why the defensive approach is to never hide unlocked
   * plugs.
   */
  const shownLockedPlugsSelector = createSelector(
    d2ManifestSelector,
    collectionsVisibleShadersSelector,
    (_state: RootState, { socket }: ProvidedProps) => socket.socketDefinition,
    (defs, visibleShaders, socketDef) => {
      const socketType = defs?.SocketType.get(socketDef.socketTypeHash);
      if (socketType?.plugWhitelist.some((p) => p.categoryHash === PlugCategoryHashes.Shader)) {
        return visibleShaders;
      }
      return undefined;
    }
  );

  /**
   * Build a set of the inventory item hashes of all mods in inventory that
   * could be plugged into this socket. This includes things like legacy mods
   * and consumable mods.
   */
  const inventoryPlugs = createSelector(
    allItemsSelector,
    (_state: RootState, props: ProvidedProps) => props.socket.socketDefinition.socketTypeHash,
    (_state: RootState, props: ProvidedProps) => props.socket.socketDefinition.plugSources,
    d2ManifestSelector,
    (allItems, socketTypeHash, plugSources, defs) => {
      const socketType = defs!.SocketType.get(socketTypeHash);
      if (!(plugSources & SocketPlugSources.InventorySourced && socketType.plugWhitelist)) {
        return emptySet<number>();
      }

      const modHashes = new Set<number>();

      const plugAllowList = new Set(socketType.plugWhitelist.map((e) => e.categoryHash));
      for (const item of allItems) {
        const itemDef = defs!.InventoryItem.get(item.hash);
        if (
          itemDef.plug &&
          plugAllowList.has(itemDef.plug.plugCategoryHash) &&
          item.location.hash === BucketHashes.Modifications
        ) {
          modHashes.add(item.hash);
        }
      }

      return modHashes;
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    inventoryPlugs: inventoryPlugs(state, props),
    unlockedPlugs: unlockedPlugsSelector(state, props),
    shownLockedPlugs: shownLockedPlugsSelector(state, props),
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

export const SocketDetailsMod = React.memo(
  ({
    itemDef,
    className,
    onClick,
  }: {
    itemDef: PluggableInventoryItemDefinition;
    className?: string;
    onClick?(mod: PluggableInventoryItemDefinition): void;
  }) => {
    const onClickFn = onClick && (() => onClick(itemDef));

    return (
      <div
        role="button"
        className={clsx('item', className)}
        title={`${itemDef.displayProperties.name}\n${itemDef.itemTypeDisplayName}`}
        onClick={onClickFn}
        tabIndex={0}
      >
        <DefItemIcon itemDef={itemDef} />
      </div>
    );
  }
);

function SocketDetails({
  item,
  socket,
  unlockedPlugs,
  inventoryPlugs,
  shownLockedPlugs,
  allowInsertPlug,
  onClose,
  onPlugSelected,
}: Props) {
  const defs = useD2Definitions()!;
  const initialPlug = socket.plugged?.plugDef;
  const [selectedPlug, setSelectedPlug] = useState<PluggableInventoryItemDefinition | null>(
    initialPlug || null
  );
  const [query, setQuery] = useState('');
  const language = useSelector(languageSelector);

  const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
  const socketCategory = defs.SocketCategory.get(socketType.socketCategoryHash);

  // Start with the inventory plugs
  const modHashes = new Set<number>(inventoryPlugs);
  const otherUnlockedPlugs = new Set<number>();
  for (const modHash of inventoryPlugs) {
    otherUnlockedPlugs.add(modHash);
  }

  const initialPlugHash = socket.socketDefinition.singleInitialItemHash;
  if (initialPlugHash) {
    modHashes.add(initialPlugHash);
  }

  if (
    socket.socketDefinition.plugSources & SocketPlugSources.ReusablePlugItems &&
    socket.reusablePlugItems?.length
  ) {
    for (const plugItem of socket.reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
      if (plugIsInsertable(plugItem)) {
        otherUnlockedPlugs.add(plugItem.plugItemHash);
      }
    }
  }

  if (socket.plugSet?.plugs) {
    for (const dimPlug of socket.plugSet.plugs) {
      modHashes.add(dimPlug.plugDef.hash);
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

  // Is this plug available to use?
  const unlocked = (i: PluggableInventoryItemDefinition) =>
    i.hash === initialPlugHash || unlockedPlugs.has(i.hash) || otherUnlockedPlugs.has(i.hash);

  const searchFilter = createPlugSearchPredicate(query, language, defs);

  let mods = Array.from(modHashes, (h) => defs.InventoryItem.get(h))
    .filter(isPluggableItem)
    .filter(
      (i) =>
        !i.plug.energyCost ||
        (energyType && i.plug.energyCost.energyTypeHash === energyType.hash) ||
        i.plug.energyCost.energyType === DestinyEnergyType.Any
    );

  const requiresEnergy = mods.some((i) => i.plug.energyCost?.energyCost);

  mods = mods
    .filter(searchFilter)
    .filter((i) => unlocked(i) || !shownLockedPlugs || shownLockedPlugs.has(i.hash))
    .sort(
      chainComparator(
        compareBy((i) => i.hash !== initialPlugHash),
        reverseComparator(compareBy(unlocked)),
        compareBy((i) => i.plug?.energyCost?.energyCost),
        compareBy((i) => -i.inventory!.tierType),
        compareBy((i) => i.displayProperties.name)
      )
    );

  if (initialPlug) {
    mods = mods.filter((m) => m.hash !== initialPlug.hash);
    mods.unshift(initialPlug);
  }

  const initialItem =
    socket.socketDefinition.singleInitialItemHash > 0 &&
    defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);

  const header = (
    <div>
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
      <div className="item-picker-search">
        <SearchInput
          query={query}
          onQueryChanged={setQuery}
          placeholder={t('Sockets.Search')}
          autoFocus
        />
      </div>
    </div>
  );

  const footer =
    selectedPlug &&
    isPluggableItem(selectedPlug) &&
    (({ onClose }: { onClose(): void }) => (
      <SocketDetailsSelectedPlug
        plug={selectedPlug}
        item={item}
        socket={socket}
        currentPlug={socket.plugged}
        equippable={unlocked(selectedPlug)}
        allowInsertPlug={allowInsertPlug}
        onPlugSelected={onPlugSelected}
        closeMenu={onClose}
      />
    ));

  // TODO: have compact and "list" views
  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName={styles.socketDetailsSheet}
    >
      <div className={clsx('sub-bucket', styles.modList)}>
        {mods.map((mod) => (
          <SocketDetailsMod
            key={mod.hash}
            className={clsx(styles.clickableMod, {
              [styles.selected]: selectedPlug === mod,
              [styles.notUnlocked]: !unlocked(mod),
            })}
            itemDef={mod}
            onClick={setSelectedPlug}
          />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps, {}, ProvidedProps>(mapStateToProps)(SocketDetails);
