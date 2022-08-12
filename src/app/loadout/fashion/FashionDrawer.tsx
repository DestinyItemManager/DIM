import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { PressTip } from 'app/dim-ui/PressTip';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { allItemsSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import SocketDetails from 'app/item-popup/SocketDetails';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, clearIcon, rightArrowIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { getSocketsByCategoryHash, plugFitsIntoSocket } from 'app/utils/socket-utils';
import { Portal } from 'app/utils/temp-container';
import {
  DestinyCollectibleDefinition,
  DestinyInventoryItemDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { BucketPlaceholder } from '../loadout-ui/BucketPlaceholder';
import PlugDef from '../loadout-ui/PlugDef';
import styles from './FashionDrawer.m.scss';

interface PickPlugState {
  item: DimItem;
  socket: DimSocket;
}

/** An editor for "Fashion" (shaders and ornaments) in a loadout */
export default function FashionDrawer({
  loadout,
  storeId,
  items,
  onModsByBucketUpdated,
  onClose,
}: {
  loadout: Loadout;
  storeId?: string;
  items: ResolvedLoadoutItem[];
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const unlockedPlugs = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );
  const isPhonePortrait = useIsPhonePortrait();
  const [pickPlug, setPickPlug] = useState<PickPlugState>();
  const allItems = useSelector(allItemsSelector);
  const armor = items.filter(
    (li) => li.loadoutItem.equip && LockableBucketHashes.includes(li.item.bucket.hash)
  );

  const classType = loadout.classType;

  const armorItemsByBucketHash: { [bucketHash: number]: ResolvedLoadoutItem | undefined } = _.keyBy(
    armor,
    (li) => li.item.bucket.hash
  );

  // The items we'll use to determine what sockets are available on each item. Either the equipped item from
  // the loadout, or a suitable "example" item from inventory.
  const exampleItemsByBucketHash = Object.fromEntries(
    LockableBucketHashes.map((bucketHash) => {
      const looksFashionable = (i: DimItem) =>
        i.bucket.hash === bucketHash && i.power && i.energy && i.classType === classType;
      const getFashionSockets = (i: DimItem) =>
        getSocketsByCategoryHash(i.sockets, SocketCategoryHashes.ArmorCosmetics);

      // TODO: is this really the best way to do this? we just default to the equipped item, but that may be an exotic
      const exampleItem =
        armorItemsByBucketHash[bucketHash]?.item ??
        // Try to find a legendary example
        allItems.find(
          (i) => i.tier === 'Legendary' && looksFashionable(i) && getFashionSockets(i).length > 1
        ) ??
        // Fall back to any non-exotic example
        allItems.find(
          (i) => !i.isExotic && looksFashionable(i) && getFashionSockets(i).length > 1
        ) ??
        // Finally, find something shaderable at least. This user must have only rudimentary armor.
        allItems.find(
          (i) =>
            !i.isExotic &&
            i.bucket.hash === bucketHash &&
            i.classType === classType &&
            getFashionSockets(i).length
        );
      return [bucketHash, exampleItem];
    })
  );

  const [modsByBucket, setModsByBucket] = useState(loadout.parameters?.modsByBucket ?? {});
  const isShader = (h: number) =>
    defs.InventoryItem.get(h)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
  const modHashes = Object.values(modsByBucket).flat();
  const shaders = modHashes.filter(isShader);
  const ornaments = modHashes.filter((h) => !isShader(h));

  const header = (
    <>
      <h1>{t('FashionDrawer.Title')}</h1>
    </>
  );

  const footer = ({ onClose }: { onClose(): void }) => (
    <>
      <button
        type="button"
        className="dim-button"
        onClick={() => {
          onModsByBucketUpdated(modsByBucket);
          onClose();
        }}
      >
        {t('FashionDrawer.Accept')}
      </button>
    </>
  );

  const handlePlugSelected = ({
    item,
    socket,
    plugHash,
  }: {
    item: DimItem;
    socket: DimSocket;
    plugHash: number;
  }) => {
    setModsByBucket((modsByBucket) => {
      // Clear out existing selections for this socket.
      const existingMods = (modsByBucket[item.bucket.hash] ?? []).filter(
        (mod) => !plugFitsIntoSocket(socket, mod)
      );

      return {
        ...modsByBucket,
        // Add in the new mod
        [item.bucket.hash]: [...existingMods, plugHash],
      };
    });
  };

  const handleUseEquipped = () => {
    const newModsByBucket = Object.fromEntries(
      LockableBucketHashes.map((bucketHash) => {
        // Either the item that's in the loadout, or whatever's equipped
        const item =
          armorItemsByBucketHash[bucketHash]?.item ??
          allItems.find(
            (i) =>
              i.bucket.hash === bucketHash &&
              i.equipped &&
              (storeId ? i.owner === storeId : i.classType === classType)
          );
        const cosmeticSockets = item?.sockets
          ? getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics)
          : [];
        return [
          bucketHash,
          _.compact(cosmeticSockets.map((s) => (s.actuallyPlugged || s.plugged)?.plugDef.hash)),
        ];
      })
    );

    setModsByBucket(newModsByBucket);
  };

  const handleSyncShader = () => {
    const shaders = Object.values(modsByBucket).flat().filter(isShader);

    const groupedShaders = _.groupBy(shaders, (h) => h);
    const mostCommonShaders = _.maxBy(Object.values(groupedShaders), (shaders) => shaders.length);
    if (!mostCommonShaders) {
      return;
    }

    setModsByBucket((modsByBucket) =>
      Object.fromEntries(
        LockableBucketHashes.map((bucketHash) => [
          bucketHash,
          [...(modsByBucket[bucketHash] ?? []).filter((h) => !isShader(h)), mostCommonShaders[0]],
        ])
      )
    );
  };

  const handleSyncOrnament = () => {
    const isShader = (h: number) =>
      defs.InventoryItem.get(h)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
    const ornaments = Object.values(modsByBucket)
      .flat()
      .filter((h) => !isShader(h));

    // Make it easy to spread default ornament
    if (ornaments.every((h) => DEFAULT_ORNAMENTS.includes(h))) {
      setModsByBucket((modsByBucket) =>
        Object.fromEntries(
          LockableBucketHashes.map((bucketHash) => [
            bucketHash,
            [...(modsByBucket[bucketHash] ?? []).filter((h) => isShader(h)), ornaments[0]],
          ])
        )
      );
      return;
    }

    const groupedOrnaments = _.groupBy(ornaments, (h) => {
      const collectibleHash =
        defs.InventoryItem.get(h)?.collectibleHash ??
        // if the item has no collectible hash, try to find an "identical" item with one
        findOtherCopies(defs, h).find((i) => i.collectibleHash)?.collectibleHash;

      return collectibleHash && defs.Collectible.get(collectibleHash)?.parentNodeHashes[0];
    });
    delete groupedOrnaments['undefined'];
    const mostCommonOrnamentSet = _.maxBy(
      Object.entries(groupedOrnaments),
      ([_presentationHash, ornaments]) => ornaments.length
    );
    if (!mostCommonOrnamentSet) {
      return;
    }

    const mostCommon = parseInt(mostCommonOrnamentSet[0], 10);
    const set = _.compact(
      defs.PresentationNode.get(mostCommon).children.collectibles.map(
        (c) =>
          defs.Collectible.get(c.collectibleHash).itemHash ??
          manuallyFindItemForCollectible(defs, c.collectibleHash)?.hash
      )
    );

    if (set.length !== 5) {
      return;
    }

    setModsByBucket((modsByBucket) =>
      Object.fromEntries(
        LockableBucketHashes.map((bucketHash, i) => {
          let ornamentHash = set[i];

          // if we picked a parent node that doesn't point to ornaments,
          // try to find an "identical" item that *is* an unlocked plug
          if (!unlockedPlugs.has(ornamentHash)) {
            const ornamentVersion = findOtherCopies(defs, ornamentHash).find((i) =>
              unlockedPlugs.has(i.hash)
            );
            ornamentHash = ornamentVersion?.hash ?? ornamentHash;
          }

          if (unlockedPlugs.has(ornamentHash)) {
            const modsWithoutShaders = (modsByBucket[bucketHash] ?? []).filter((h) => isShader(h));
            const mods = [...modsWithoutShaders, ornamentHash];
            return [bucketHash, mods];
          }

          return [bucketHash, modsByBucket[bucketHash] ?? []];
        })
      )
    );
  };

  const handleClearType = (shaders: boolean) => {
    setModsByBucket(
      produce((modsByBucket) => {
        for (const bucket in modsByBucket) {
          const mods = modsByBucket[bucket];
          const modsWithoutShaders = mods.filter((h) => (shaders ? !isShader(h) : isShader(h)));
          if (modsWithoutShaders.length === 0) {
            delete modsByBucket[bucket];
          } else {
            modsByBucket[bucket] = modsWithoutShaders;
          }
        }
      })
    );
  };

  const handleRemovePlug = (bucketHash: number, plugHash: number) => {
    setModsByBucket((modsByBucket) => ({
      ...modsByBucket,
      [bucketHash]: modsByBucket[bucketHash].filter((m) => m !== plugHash),
    }));
  };

  const leftButtons = (
    <>
      <div>
        <button type="button" className="dim-button" onClick={handleUseEquipped}>
          {t('FashionDrawer.UseEquipped')}
        </button>
      </div>
      <div>
        <button
          type="button"
          className="dim-button"
          onClick={handleSyncShader}
          disabled={shaders.length === 0}
          title={t('FashionDrawer.SyncShadersTitle')}
        >
          {isPhonePortrait ? t('FashionDrawer.SyncShaders') : t('FashionDrawer.Sync')}{' '}
          <AppIcon icon={rightArrowIcon} />
        </button>
      </div>
      <div>
        <button
          type="button"
          className="dim-button"
          onClick={handleSyncOrnament}
          disabled={ornaments.length === 0}
          title={t('FashionDrawer.SyncOrnamentsTitle')}
        >
          {isPhonePortrait ? t('FashionDrawer.SyncOrnaments') : t('FashionDrawer.Sync')}{' '}
          <AppIcon icon={rightArrowIcon} />
        </button>
      </div>
    </>
  );

  const rightButtons = (
    <>
      <div>
        <button
          type="button"
          className="dim-button"
          onClick={() => setModsByBucket({})}
          disabled={_.isEmpty(modsByBucket)}
        >
          {t('FashionDrawer.Reset')}
        </button>
      </div>
      <div>
        <button
          type="button"
          className="dim-button"
          onClick={() => handleClearType(true)}
          disabled={shaders.length === 0}
          title={t('FashionDrawer.ClearShadersTitle')}
        >
          <AppIcon icon={clearIcon} /> {isPhonePortrait && t('FashionDrawer.ClearShaders')}
        </button>
      </div>
      <div>
        <button
          type="button"
          className="dim-button"
          onClick={() => handleClearType(false)}
          disabled={ornaments.length === 0}
          title={t('FashionDrawer.ClearOrnamentsTitle')}
        >
          <AppIcon icon={clearIcon} /> {isPhonePortrait && t('FashionDrawer.ClearOrnaments')}
        </button>
      </div>
    </>
  );

  return (
    <Sheet onClose={onClose} header={header} footer={footer} sheetClassName={styles.sheet}>
      <div className={styles.items}>
        {!isPhonePortrait && <div className={styles.verticalButtons}>{leftButtons}</div>}
        {LockableBucketHashes.map((bucketHash) => (
          <FashionItem
            key={bucketHash}
            bucketHash={bucketHash}
            item={armorItemsByBucketHash[bucketHash]}
            exampleItem={exampleItemsByBucketHash[bucketHash]}
            mods={modsByBucket[bucketHash]}
            storeId={storeId}
            onPickPlug={setPickPlug}
            onRemovePlug={handleRemovePlug}
          />
        ))}
        {!isPhonePortrait && (
          <div className={clsx(styles.verticalButtons, styles.right)}>{rightButtons}</div>
        )}
      </div>
      {isPhonePortrait && (
        <div className={styles.buttons}>
          {leftButtons}
          {rightButtons}
        </div>
      )}
      {pickPlug && (
        <Portal>
          <SocketDetails
            item={pickPlug.item}
            allowInsertPlug={false}
            socket={pickPlug.socket}
            onClose={() => setPickPlug(undefined)}
            onPlugSelected={handlePlugSelected}
          />
        </Portal>
      )}
    </Sheet>
  );
}

function FashionItem({
  item,
  exampleItem,
  bucketHash,
  mods = [],
  storeId,
  onPickPlug,
  onRemovePlug,
}: {
  item?: ResolvedLoadoutItem;
  exampleItem?: DimItem;
  bucketHash: number;
  mods?: number[];
  storeId?: string;
  onPickPlug(params: PickPlugState): void;
  onRemovePlug(bucketHash: number, modHash: number): void;
}) {
  const defs = useD2Definitions()!;
  const isShader = (m: number) =>
    defs.InventoryItem.get(m)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
  const shader = mods.find(isShader);
  const ornament = mods.find((m) => !isShader(m));

  const shaderItem = shader ? defs.InventoryItem.get(shader) : undefined;
  const ornamentItem = ornament ? defs.InventoryItem.get(ornament) : undefined;

  if (!exampleItem) {
    return null;
  }

  const isShaderSocket = (s: DimSocket) =>
    defs.SocketType.get(s.socketDefinition.socketTypeHash)?.plugWhitelist.some(
      (pw) => pw.categoryHash === PlugCategoryHashes.Shader
    );
  const cosmeticSockets = getSocketsByCategoryHash(
    exampleItem.sockets,
    SocketCategoryHashes.ArmorCosmetics
  );
  const shaderSocket = cosmeticSockets.find(isShaderSocket);
  const ornamentSocket = cosmeticSockets.find((s) => !isShaderSocket(s));

  const defaultShader = defs.InventoryItem.get(DEFAULT_SHADER);
  const defaultOrnament = defs.InventoryItem.get(DEFAULT_ORNAMENTS[2]);

  return (
    <div className={styles.item}>
      {item ? (
        <ConnectedInventoryItem item={exampleItem} />
      ) : (
        <BucketPlaceholder bucketHash={bucketHash} />
      )}
      <FashionSocket
        bucketHash={bucketHash}
        plugHash={shader}
        socket={shaderSocket}
        plug={shaderItem}
        exampleItem={exampleItem}
        defaultPlug={defaultShader}
        storeId={storeId}
        onPickPlug={onPickPlug}
        onRemovePlug={onRemovePlug}
      />
      <FashionSocket
        bucketHash={bucketHash}
        plugHash={ornament}
        socket={ornamentSocket}
        plug={ornamentItem}
        exampleItem={exampleItem}
        storeId={storeId}
        defaultPlug={defaultOrnament}
        onPickPlug={onPickPlug}
        onRemovePlug={onRemovePlug}
      />
    </div>
  );
}

function FashSocketTooltip({
  bucketHash,
  socket,
}: {
  bucketHash: number;
  socket: DimSocket | undefined;
}) {
  let text = t('FashionDrawer.NoPreference');

  if (!socket && bucketHash === BucketHashes.Shaders) {
    text = 'This item cannot fit a shader';
  } else if (!socket) {
    text = 'This item cannot fit an ornament';
  }
  return <div>{text}</div>;
}

function FashionSocket({
  bucketHash,
  plugHash,
  socket,
  plug,
  exampleItem,
  storeId,
  defaultPlug,
  onPickPlug,
  onRemovePlug,
}: {
  bucketHash: number;
  plugHash: number | undefined;
  socket: DimSocket | undefined;
  plug: DestinyInventoryItemDefinition | undefined;
  exampleItem: DimItem;
  storeId?: string;
  defaultPlug: DestinyInventoryItemDefinition;
  onPickPlug(params: PickPlugState): void;
  onRemovePlug(bucketHash: number, modHash: number): void;
}) {
  const unlockedPlugSetItems = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );
  const handleOrnamentClick = socket && (() => onPickPlug({ item: exampleItem, socket }));
  const canSlotOrnament =
    plugHash !== undefined &&
    (plugHash === socket?.emptyPlugItemHash ||
      (unlockedPlugSetItems.has(plugHash) &&
        socket?.plugSet?.plugs.some((p) => p.plugDef.hash === plugHash)) ||
      socket?.reusablePlugItems?.some((p) => p.plugItemHash === plugHash && p.enabled));

  let content = null;

  if (plug) {
    content = (
      <PlugDef
        onClick={handleOrnamentClick}
        className={clsx({ [styles.missingItem]: !canSlotOrnament })}
        plug={(plug ?? defaultPlug) as PluggableInventoryItemDefinition}
      />
    );
  } else {
    content = (
      <PressTip tooltip={<FashSocketTooltip bucketHash={bucketHash} socket={socket} />}>
        <div
          role={socket && 'button'}
          className={clsx('item', {
            [styles.missingItem]: !canSlotOrnament,
            [styles.noSocket]: !socket,
          })}
        >
          <DefItemIcon itemDef={defaultPlug} />
        </div>
      </PressTip>
    );
  }

  return (
    <ClosableContainer
      onClose={plugHash ? () => onRemovePlug(bucketHash, plugHash) : undefined}
      showCloseIconOnHover={true}
    >
      {content}
    </ClosableContainer>
  );
}

function findOtherCopies(
  defs: D2ManifestDefinitions,
  item: DestinyInventoryItemDefinition | DimItem | number
) {
  const itemDef = defs.InventoryItem.get(typeof item === 'number' ? item : item.hash);
  const results: DestinyInventoryItemDefinition[] = [];
  const invItemTable = defs.InventoryItem.getAll();
  for (const h in invItemTable) {
    const i = invItemTable[h];
    if (
      i.displayProperties.name === itemDef.displayProperties.name &&
      i.displayProperties.icon === itemDef.displayProperties.icon
    ) {
      results.push(i);
    }
  }
  return results;
}

function manuallyFindItemForCollectible(
  defs: D2ManifestDefinitions,
  collectible: DestinyCollectibleDefinition | number
) {
  const collectibleHash = typeof collectible === 'number' ? collectible : collectible.hash;
  const invItemTable = defs.InventoryItem.getAll();
  for (const h in invItemTable) {
    const i = invItemTable[h];
    if (i.collectibleHash === collectibleHash) {
      return i;
    }
  }
}
