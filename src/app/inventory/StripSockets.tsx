import Sheet from 'app/dim-ui/Sheet';
import 'app/inventory-page/StoreBucket.scss';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faCheckCircle, refreshIcon } from 'app/shell/icons';
import { withCancel } from 'app/utils/cancel';
import { useMemo, useState } from 'react';
import styles from './StripSockets.m.scss';

import { t, tl } from 'app/i18next-t';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { filterFactorySelector } from 'app/search/search-filter';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Observable } from 'app/utils/observable';
import { uniqBy } from 'app/utils/util';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import { canInsertPlug, insertPlug } from './advanced-write-actions';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from './item-types';
import { DefItemIcon } from './ItemIcon';
import { allItemsSelector } from './selectors';

import chestArmorItem from 'destiny-icons/armor_types/chest.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';

/**
 * The currently active search query
 */
export const stripSocketsQuery$ = new Observable<string | undefined>(undefined);

/**
 * Show the gear power sheet
 */
export function stripSockets(query: string) {
  stripSocketsQuery$.next(query);
}

type State =
  | {
      tag: 'selecting';
    }
  | {
      tag: 'processing';
      cancel: () => void;
    };

/** A made-up socket classification. */
type SocketKind =
  | 'shaders'
  | 'ornaments'
  | 'weaponmods'
  | 'artifactmods'
  | 'armormods'
  | 'subclass'
  | 'others';

function identifySocket(
  item: DimItem,
  socket: DimSocket,
  plugDef: PluggableInventoryItemDefinition,
  artifactMods: Set<number> | undefined
): SocketKind | undefined {
  if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders)) {
    return 'shaders';
  } else if (DEFAULT_ORNAMENTS.includes(socket.emptyPlugItemHash!)) {
    return 'ornaments';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage)) {
    return 'weaponmods';
  } else if (artifactMods?.has(plugDef.hash)) {
    return 'artifactmods';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    return 'armormods';
  } else if (
    item.bucket.hash === BucketHashes.Subclass &&
    // Hack: some Subclasses 3.0 have the wrong empty socket as singleInitialItemHash, but
    // we don't really want to try replacing it with the other one because it looks weird
    plugDef.hash !== socket.socketDefinition.singleInitialItemHash
  ) {
    return 'subclass';
  } else if (plugDef.plug.plugCategoryHash === PlugCategoryHashes.Hologram) {
    return 'others';
  }
}

export default function StripSockets() {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const destiny2CoreSettings = useSelector(destiny2CoreSettingsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const filterFactory = useSelector(filterFactorySelector);
  const query = useSubscription(stripSocketsQuery$);

  const [state, setState] = useState<State>({ tag: 'selecting' });
  const [activeKinds, setActiveKinds] = useState<SocketKind[]>([]);

  const artifactMods = useMemo(() => {
    const artifactItem = allItems.find((i) => i.bucket.hash === BucketHashes.SeasonalArtifact);
    const vendor = artifactItem?.previewVendor && defs.Vendor.get(artifactItem.previewVendor);
    return vendor ? new Set(vendor.itemList.map((i) => i.itemHash)) : undefined;
  }, [allItems, defs]);

  const socketKinds = useMemo(() => {
    if (!query) {
      return undefined;
    }

    const filterFunc = filterFactory(query);
    const filteredItems = allItems.filter((i) => i.sockets && filterFunc(i));
    const socketsByKind: {
      [kind in SocketKind]: {
        name: string;
        items?: { item: DimItem; socketIndex: number }[];
      };
    } = {
      shaders: {
        name: tl('StripSockets.Shaders'),
      },
      ornaments: {
        name: tl('StripSockets.Ornaments'),
      },
      weaponmods: {
        name: tl('StripSockets.WeaponMods'),
      },
      artifactmods: {
        name: tl('StripSockets.ArtifactMods'),
      },
      armormods: {
        name: tl('StripSockets.ArmorMods'),
      },
      subclass: {
        name: tl('StripSockets.Subclass'),
      },
      others: {
        name: tl('StripSockets.Others'),
      },
    };

    for (const item of filteredItems) {
      for (const socket of item.sockets!.allSockets) {
        if (
          socket.emptyPlugItemHash &&
          socket.plugged &&
          socket.plugged.plugDef.hash !== socket.emptyPlugItemHash &&
          canInsertPlug(socket, socket.emptyPlugItemHash, destiny2CoreSettings, defs)
        ) {
          const plugDef = socket.plugged.plugDef;
          const kind = identifySocket(item, socket, plugDef, artifactMods);
          if (kind) {
            (socketsByKind[kind].items ??= []).push({ item, socketIndex: socket.socketIndex });
          }
        }
      }
    }

    const socketKinds = [];
    for (const [kind, contents] of Object.entries(socketsByKind)) {
      if (!contents.items) {
        continue;
      }
      const affectedItems = uniqBy(contents.items, (i) => i.item.id);
      const numApplicableItems = affectedItems.length;

      const numWeapons = affectedItems.filter((i) => i.item.bucket.inWeapons).length;
      const numArmor = affectedItems.filter((i) => i.item.bucket.inArmor).length;
      const numOthers = numApplicableItems - numWeapons - numArmor;

      const numApplicableSockets = contents.items.length;

      if (numApplicableSockets > 0) {
        // Choose a socket that would be cleared by this "kind button" and
        // show the current plug as a large icon for that button.
        // This immediately presents an example for what would happen if the user
        // decided to strip sockets of this kind.
        const representativeAction = contents.items[contents.items.length - 1];
        const representativePlug = representativeAction.item.sockets!.allSockets.find(
          (s) => s.socketIndex === representativeAction.socketIndex
        )!.plugged!.plugDef;

        socketKinds.push({
          kind: kind as SocketKind,
          ...contents,
          representativePlug,
          numWeapons,
          numArmor,
          numOthers,
          numApplicableSockets,
        });
      }
    }

    return socketKinds;
  }, [allItems, artifactMods, defs, destiny2CoreSettings, filterFactory, query]);

  if (!socketKinds) {
    return null;
  }

  const reset = () => {
    if (state.tag === 'processing') {
      state.cancel();
    }
    stripSocketsQuery$.next(undefined);
  };

  const onInsertPlugs = async () => {
    if (state.tag === 'processing') {
      return;
    }

    const [cancelToken, cancel] = withCancel();

    setState({
      tag: 'processing',
      cancel,
    });

    const socketList = socketKinds
      .filter((k) => k.items && activeKinds.includes(k.kind))
      .flatMap((k) => k.items!);
    try {
      for (const entry of socketList) {
        cancelToken.checkCanceled();

        try {
          const socket = entry.item.sockets!.allSockets.find(
            (i) => i.socketIndex === entry.socketIndex
          )!;
          await dispatch(insertPlug(entry.item, socket, socket.emptyPlugItemHash!));
        } catch (e) {
          // How to handle failure???
        }
      }
    } finally {
      setState({ tag: 'selecting' });
    }
  };

  const onClose = () => {
    reset();
  };

  const totalNumSockets = _.sumBy(socketKinds, (kind) =>
    activeKinds.includes(kind.kind) ? kind.numApplicableSockets : 0
  );

  const header = (
    <div>
      <h1>{t('StripSockets.Choose')}</h1>
    </div>
  );

  const contents = (
    <>
      {socketKinds.length
        ? socketKinds.map((entry) => (
            <SocketKindButton
              key={entry.kind}
              name={t(entry.name, { count: entry.numApplicableSockets })}
              representativeDef={entry.representativePlug}
              numArmor={entry.numArmor}
              numWeapons={entry.numWeapons}
              numOthers={entry.numOthers}
              selected={activeKinds.includes(entry.kind)}
              onClick={() => {
                if (activeKinds.includes(entry.kind)) {
                  setActiveKinds(activeKinds.filter((k) => k !== entry.kind));
                } else {
                  setActiveKinds([...activeKinds, entry.kind]);
                }
              }}
            />
          ))
        : 'No sockets to clear'}
    </>
  );

  const footer = (
    <button
      type="button"
      className={styles.insertButton}
      onClick={onInsertPlugs}
      disabled={state.tag === 'processing' || totalNumSockets === 0}
    >
      {state.tag === 'processing' && (
        <span>
          <AppIcon icon={refreshIcon} spinning={true} />
        </span>
      )}
      <span>
        <AppIcon icon={faCheckCircle} />
        {t('StripSockets.Button', { numSockets: totalNumSockets })}
      </span>
    </button>
  );

  return (
    <Sheet onClose={onClose} header={header} footer={footer} sheetClassName={styles.stripSheet}>
      {contents}
    </Sheet>
  );
}

function SocketKindButton({
  name,
  representativeDef,
  numWeapons,
  numArmor,
  numOthers,
  selected,
  onClick,
}: {
  name: string;
  representativeDef: DestinyInventoryItemDefinition;
  numWeapons: number;
  numArmor: number;
  numOthers: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={clsx(styles.socketKindButton, {
        [styles.selectedButton]: selected,
      })}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="item" title={name}>
        <DefItemIcon itemDef={representativeDef} />
      </div>
      <div className={styles.buttonInfo}>
        <div
          className={clsx(styles.buttonTitle, {
            [styles.selectedTitle]: selected,
          })}
        >
          {name}
        </div>
      </div>
      <div>
        {numWeapons > 0 && (
          <>
            <img src={handCannonIcon} className={clsx(styles.itemTypeIcon, styles.svg)} />{' '}
            {numWeapons}
            <br />
          </>
        )}
        {numArmor > 0 && (
          <>
            <img src={chestArmorItem} className={clsx(styles.itemTypeIcon, styles.svg)} />{' '}
            {numArmor}
            <br />
          </>
        )}

        {numOthers > 0 && (
          /* help what is a good icon for "others"? */
          <>
            <img
              src="https://www.bungie.net/common/destiny2_content/icons/DestinyPresentationNodeDefinition_cd1c756720046ac6eded22b9a3d8c1bd.png"
              className={styles.itemTypeIcon}
            />{' '}
            {numOthers}
          </>
        )}
      </div>
    </div>
  );
}
