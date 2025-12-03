import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, profileResponseSelector } from 'app/inventory/selectors';
import { isValidMasterworkStat } from 'app/inventory/store/masterwork';
import { hashesToPluggableItems, isPluggableItem } from 'app/inventory/store/sockets';
import { mapToOtherModCostVariant } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { unlockedItemsForCharacterOrProfilePlugSet } from 'app/records/plugset-helpers';
import { collectionsVisibleShadersSelector } from 'app/records/selectors';
import { SearchInput } from 'app/search/SearchInput';
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import { createPlugSearchPredicate } from 'app/search/plug-search';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptySet } from 'app/utils/empty';
import { DestinyProfileResponse, PlugUiStyles, SocketPlugSources } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import '../inventory-page/StoreBucket.scss';
import * as styles from './SocketDetails.m.scss';
import SocketDetailsSelectedPlug from './SocketDetailsSelectedPlug';

/**
 * Build a set of the inventory item hashes of all plug items in the socket's
 * plug set that are unlocked by this character.
 */
function buildUnlockedPlugs(
  profileResponse: DestinyProfileResponse | undefined,
  owner: string,
  socket: DimSocket,
) {
  const plugSetHash =
    socket.socketDefinition.reusablePlugSetHash || socket.socketDefinition.randomizedPlugSetHash;
  if (!plugSetHash || !profileResponse) {
    return emptySet<number>();
  }
  return unlockedItemsForCharacterOrProfilePlugSet(profileResponse, plugSetHash, owner);
}

/**
 * Build a set of items that should be shown even if locked. If undefined, show all.
 * This is a heuristic only, which is why the defensive approach is to never hide unlocked
 * plugs.
 */
function buildShownLockedPlugs(
  defs: D2ManifestDefinitions | undefined,
  visibleShaders: Set<number> | undefined,
  socket: DimSocket,
) {
  const socketType = defs?.SocketType.get(socket.socketDefinition.socketTypeHash);
  if (socketType?.plugWhitelist.some((p) => p.categoryHash === PlugCategoryHashes.Shader)) {
    return visibleShaders;
  }
  return undefined;
}

/**
 * Build a set of the inventory item hashes of all mods in inventory that
 * could be plugged into this socket. This includes things like legacy mods
 * and consumable mods.
 */
function buildInventoryPlugs(allItems: DimItem[], socket: DimSocket, defs: D2ManifestDefinitions) {
  const socketTypeHash = socket.socketDefinition.socketTypeHash;
  const plugSources = socket.socketDefinition.plugSources;
  const socketType = defs.SocketType.get(socketTypeHash);
  if (!(plugSources & SocketPlugSources.InventorySourced && socketType.plugWhitelist)) {
    return emptySet<number>();
  }

  const modHashes = new Set<number>();

  const plugAllowList = new Set(socketType.plugWhitelist.map((e) => e.categoryHash));
  for (const item of allItems) {
    const itemDef = defs.InventoryItem.get(item.hash);
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

export const SocketDetailsMod = memo(
  ({
    itemDef,
    className,
    onClick,
  }: {
    itemDef: PluggableInventoryItemDefinition;
    className?: string;
    onClick?: (mod: PluggableInventoryItemDefinition) => void;
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
  },
);

export default function SocketDetails({
  item,
  socket,
  allowInsertPlug,
  onClose,
  onPlugSelected,
}: {
  item: DimItem;
  socket: DimSocket;
  /** Set to true if you want to insert the plug when it's selected, rather than returning it. */
  allowInsertPlug: boolean;
  onClose: () => void;
  onPlugSelected?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  const defs = useD2Definitions()!;
  const plugged = socket.plugged?.plugDef;
  const actuallyPlugged = (socket.actuallyPlugged || socket.plugged)?.plugDef;
  const [selectedPlug, setSelectedPlug] = useState<PluggableInventoryItemDefinition | null>(
    plugged || null,
  );
  const [query, setQuery] = useState('');
  const language = useSelector(languageSelector);

  const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
  const socketCategory = defs.SocketCategory.get(socketType.socketCategoryHash);

  const allItems = useSelector(allItemsSelector);
  const inventoryPlugs = useMemo(
    () => buildInventoryPlugs(allItems, socket, defs),
    [allItems, defs, socket],
  );

  const visibleShaders = useSelector(collectionsVisibleShadersSelector);
  const shownLockedPlugs = useMemo(
    () => buildShownLockedPlugs(defs, visibleShaders, socket),
    [defs, socket, visibleShaders],
  );

  const profileResponse = useSelector(profileResponseSelector);
  const unlockedPlugs = useMemo(
    () => buildUnlockedPlugs(profileResponse, item.owner, socket),
    [item.owner, profileResponse, socket],
  );

  // Start with the inventory plugs
  const modHashes = new Set<number>(inventoryPlugs);
  const otherUnlockedPlugs = new Set<number>();
  for (const modHash of inventoryPlugs) {
    otherUnlockedPlugs.add(modHash);
  }

  if (socket.emptyPlugItemHash) {
    modHashes.add(socket.emptyPlugItemHash);
  }

  if (socket.reusablePlugItems) {
    for (const plugItem of socket.reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
      otherUnlockedPlugs.add(plugItem.plugItemHash);
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

  // Is this plug available to use?
  const unlocked = (i: number | undefined) =>
    i !== undefined &&
    (i === socket.emptyPlugItemHash || unlockedPlugs.has(i) || otherUnlockedPlugs.has(i));

  const searchFilter = createPlugSearchPredicate(query, language, defs);

  let mods = hashesToPluggableItems(defs, Array.from(modHashes));

  if (socket.socketDefinition.socketTypeHash === weaponMasterworkY2SocketTypeHash) {
    const matchesMasterwork = (plugOption: PluggableInventoryItemDefinition) => {
      // Full masterwork plugs have the plugStyle set to Masterwork
      if (
        plugOption.plug.plugStyle === PlugUiStyles.Masterwork &&
        isValidMasterworkStat(
          defs,
          defs.InventoryItem.get(item.hash),
          plugOption.investmentStats[0]?.statTypeHash,
        )
      ) {
        return true;
      }

      return (
        plugOption.plug.plugCategoryHash === actuallyPlugged?.plug.plugCategoryHash &&
        plugOption.investmentStats[0]?.value > actuallyPlugged.investmentStats[0]?.value
      );
    };

    mods = mods.filter(matchesMasterwork);
  }

  const requiresEnergy = mods.some((i) => i.plug.energyCost?.energyCost);

  mods = mods
    .filter(searchFilter)
    .filter(
      (i) =>
        unlocked(i.hash) ||
        (shownLockedPlugs
          ? shownLockedPlugs.has(i.hash)
          : // hide the regular-cost copies if the reduced is available, and vice versa
            !unlocked(mapToOtherModCostVariant(i.hash))),
    )
    .sort(
      chainComparator(
        compareBy((i) => i.hash !== socket.emptyPlugItemHash),
        reverseComparator(compareBy((i) => unlocked(i.hash))),
        compareBy((i) => -i.inventory!.tierType),
        compareBy(
          (i) =>
            // subclass plugs in PlugSet order
            item.bucket.hash === BucketHashes.Subclass ||
            // mods that cost something in PlugSet order
            (i.plug?.energyCost?.energyCost ?? 0) > 0 ||
            // everything else by name
            i.displayProperties.name,
        ),
      ),
    );

  if (socket.socketDefinition.socketTypeHash === weaponMasterworkY2SocketTypeHash) {
    // Higher-tier versions of the current MW first, then the others
    mods = mods.sort(
      chainComparator(
        compareBy((i) => i.plug.plugCategoryHash !== actuallyPlugged?.plug.plugCategoryHash),
        compareBy((i) => i.investmentStats[0]?.value),
      ),
    );
  }

  if (plugged) {
    mods = mods.filter((m) => m.hash !== plugged.hash);
    mods.unshift(plugged);
  }

  const socketIconDef =
    (socket.emptyPlugItemHash && defs.InventoryItem.get(socket.emptyPlugItemHash)) ||
    socket.plugged?.plugDef;

  const header = (
    <div>
      <h1 className={styles.header}>
        {socketIconDef && (
          <BungieImage
            className={styles.categoryIcon}
            src={socketIconDef.displayProperties.icon}
            alt=""
          />
        )}
        {requiresEnergy && <EnergyCostIcon className={styles.energyElement} />}
        <div>{socketCategory.displayProperties.name}</div>
      </h1>
      <SearchInput
        query={query}
        onQueryChanged={setQuery}
        placeholder={t('Sockets.Search')}
        autoFocus
      />
    </div>
  );

  const footer =
    selectedPlug &&
    isPluggableItem(selectedPlug) &&
    (({ onClose }: { onClose: () => void }) => (
      <SocketDetailsSelectedPlug
        plug={selectedPlug}
        item={item}
        socket={socket}
        currentPlug={socket.plugged}
        equippable={unlocked(selectedPlug.hash)}
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
              [styles.notUnlocked]: !unlocked(mod.hash),
            })}
            itemDef={mod}
            onClick={setSelectedPlug}
          />
        ))}
      </div>
    </Sheet>
  );
}
