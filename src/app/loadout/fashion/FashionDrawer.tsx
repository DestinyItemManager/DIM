import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import SocketDetails from 'app/item-popup/SocketDetails';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, clearIcon, rightArrowIcon } from 'app/shell/icons';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { getDefaultPlugHash } from '../mod-utils';
import styles from './FashionDrawer.m.scss';

interface PickPlugState {
  item: DimItem;
  socket: DimSocket;
}

/** An editor for "Fashion" (shaders and ornaments) in a loadout */
export default function FashionDrawer({
  loadout,
  items,
  onModsByBucketUpdated,
  onClose,
}: {
  loadout: Loadout;
  items: DimLoadoutItem[];
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const [pickPlug, setPickPlug] = useState<PickPlugState>();

  console.log({ loadout });

  const equippedIds = new Set([...loadout.items.filter((i) => i.equipped).map((i) => i.id)]);

  const armorItemsByBucketHash: { [bucketHash: number]: DimItem } = _.mapValues(
    _.groupBy(
      items.filter((i) => equippedIds.has(i.id) && LockableBucketHashes.includes(i.bucket.hash)),
      (i) => i.bucket.hash
    ),
    (items) => items[0]
  );

  // TODO: categorize by shader, ornament
  const [modsByBucket, setModsByBucket] = useState(loadout.parameters?.modsByBucket ?? {});
  const isShader = (h: number) =>
    defs.InventoryItem.get(h)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
  const modHashes = Object.values(modsByBucket).flat();
  const shaders = modHashes.filter(isShader);
  const ornaments = modHashes.filter((h) => !isShader(h));

  // TODO: if they add an armor piece that can't slot the selected mods (ornaments), clear them
  // TODO: pick mods based on what's unlocked (ModPicker may not be correct? SocketDetails?)
  // TODO: fill out fashion when adding equipped?
  // TODO: reset/clear all from top level
  // TODO: footer with an accept/cancel button? Put the other buttons there?

  console.log({ modsByBucket });

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
        Choose Fashion
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
      // Start by removing any mods that belong to the same socket as this
      const existingMods = (modsByBucket[item.bucket.hash] ?? []).filter(
        (mod) => !socket.plugSet?.plugs.some((p) => p.plugDef.hash === mod)
      );

      return {
        ...modsByBucket,
        // Add in the new mod
        [item.bucket.hash]: [...existingMods, plugHash],
      };
    });
  };

  const handleUseEquipped = () => {
    const newModsByBucket = _.mapValues(armorItemsByBucketHash, (item) => {
      const cosmeticSockets = item.sockets
        ? getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics)
        : [];
      return _.compact(cosmeticSockets.map((s) => s.plugged?.plugDef.hash));
    });

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

    const groupedOrnaments = _.groupBy(ornaments, (h) => {
      const collectibleHash = defs.InventoryItem.get(h)?.collectibleHash;
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

    console.log({ ornaments, groupedOrnaments, mostCommonOrnamentSet });

    const set = defs.PresentationNode.get(
      parseInt(mostCommonOrnamentSet[0], 10)
    ).children.collectibles.map((c) => defs.Collectible.get(c.collectibleHash).itemHash);

    console.log({ set });

    setModsByBucket((modsByBucket) =>
      Object.fromEntries(
        LockableBucketHashes.map((bucketHash, i) => [
          bucketHash,
          [...(modsByBucket[bucketHash] ?? []).filter((h) => isShader(h)), set[i]],
        ])
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

  return (
    <Sheet onClose={onClose} header={header} footer={footer} sheetClassName={styles.sheet}>
      <div className={styles.items}>
        <div className={styles.item}>
          <div className={styles.rowButton}>
            <button
              type="button"
              className="dim-button"
              onClick={handleUseEquipped}
              disabled={_.isEmpty(armorItemsByBucketHash)}
            >
              Use Equipped
            </button>
          </div>
          <div className={styles.rowButton}>
            <button
              type="button"
              className="dim-button"
              onClick={handleSyncShader}
              disabled={shaders.length === 0}
            >
              Sync <AppIcon icon={rightArrowIcon} />
            </button>
          </div>
          <div className={styles.rowButton}>
            <button
              type="button"
              className="dim-button"
              onClick={handleSyncOrnament}
              disabled={ornaments.length === 0}
            >
              Sync <AppIcon icon={rightArrowIcon} />
            </button>
          </div>
        </div>
        {LockableBucketHashes.map((bucketHash) => (
          <FashionItem
            key={bucketHash}
            classType={loadout.classType}
            bucketHash={bucketHash}
            item={armorItemsByBucketHash[bucketHash]}
            mods={modsByBucket[bucketHash]}
            onPickPlug={setPickPlug}
          />
        ))}
        <div className={styles.item}>
          <div className={clsx(styles.rowButton, styles.right)}>
            <button
              type="button"
              className="dim-button"
              onClick={() => setModsByBucket({})}
              disabled={_.isEmpty(modsByBucket)}
            >
              Reset All
            </button>
          </div>
          <div className={clsx(styles.rowButton, styles.right)}>
            <button
              type="button"
              className="dim-button"
              onClick={() => handleClearType(true)}
              disabled={shaders.length === 0}
            >
              <AppIcon icon={clearIcon} />
            </button>
          </div>
          <div className={clsx(styles.rowButton, styles.right)}>
            <button
              type="button"
              className="dim-button"
              onClick={() => handleClearType(false)}
              disabled={ornaments.length === 0}
            >
              <AppIcon icon={clearIcon} />
            </button>
          </div>
        </div>
      </div>
      {pickPlug &&
        ReactDOM.createPortal(
          <SocketDetails
            item={pickPlug.item}
            allowInsertPlug={false}
            socket={pickPlug.socket}
            onClose={() => setPickPlug(undefined)}
            onPlugSelected={handlePlugSelected}
          />,
          document.body
        )}
    </Sheet>
  );
}

function FashionItem({
  item,
  classType,
  bucketHash,
  mods,
  onPickPlug,
}: {
  item?: DimLoadoutItem;
  classType: DestinyClass;
  bucketHash: number;
  mods?: number[];
  onPickPlug(params: PickPlugState): void;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  // TODO: categorize mods by what socket they'd fit into?
  // TODO: replace default plug w/ selected plug?

  // TODO: is this really the best way to do this? we just default to the equipped item, but that may be an exotic
  const exampleItem =
    item ??
    allItems.find(
      (i) => i.bucket.hash === bucketHash && i.tier === 'Legendary' && i.classType === classType
    );

  if (!exampleItem) {
    return null;
  }

  const cosmeticSockets = getSocketsByCategoryHash(
    exampleItem.sockets!,
    SocketCategoryHashes.ArmorCosmetics
  );

  // TODO: maybe instead, partition by shader/ornament and just grey out if it won't work?

  const plugsBySocketIndex: {
    [socketIndex: number]: PluggableInventoryItemDefinition | undefined;
  } = {};
  for (const socket of cosmeticSockets) {
    const matchingMod = mods?.find((mod) =>
      socket.plugSet?.plugs.some((plug) => plug.plugDef.hash === mod)
    );
    if (matchingMod) {
      plugsBySocketIndex[socket.socketIndex] = defs.InventoryItem.get(
        matchingMod
      ) as PluggableInventoryItemDefinition;
    } else {
      const defaultHash = defs.SocketType.get(
        socket.socketDefinition.socketTypeHash
      ).plugWhitelist.some((pw) => pw.categoryHash === PlugCategoryHashes.Shader)
        ? DEFAULT_SHADER
        : getDefaultPlugHash(socket, defs);
      if (defaultHash) {
        plugsBySocketIndex[socket.socketIndex] = defs.InventoryItem.get(
          defaultHash
        ) as PluggableInventoryItemDefinition;
      }
    }
  }

  // TODO: placeholder should have bucket-specific icon

  return (
    <div className={styles.item}>
      <div className={clsx({ [styles.placeholder]: !item })}>
        <ConnectedInventoryItem item={exampleItem} />
      </div>
      {cosmeticSockets.map((socket) => {
        const plug = plugsBySocketIndex[socket.socketIndex];
        return (
          plug && (
            <div
              key={socket.socketIndex}
              className={styles.socket}
              onClick={() => onPickPlug({ item: exampleItem, socket })}
            >
              <BungieImage src={plug.displayProperties.icon} />
            </div>
          )
        );
      })}
    </div>
  );
}
