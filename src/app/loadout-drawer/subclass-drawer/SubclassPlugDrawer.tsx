import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getDefaultPlugHash } from 'app/loadout/mod-utils';
import PlugDrawer from 'app/loadout/plug-drawer/PlugDrawer';
import { PlugSet } from 'app/loadout/plug-drawer/PlugSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemsForPlugSetEverywhere } from 'app/records/plugset-helpers';
import { compareBy } from 'app/utils/comparators';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

const DISPLAYED_PLUG_STATS = [StatHashes.AspectEnergyCapacity];

type PlugSetWithDefaultPlug = PlugSet & { defaultPlug: PluggableInventoryItemDefinition };

export default function SubclassPlugDrawer({
  subclass,
  socketOverrides,
  onAccept,
  onClose,
}: {
  subclass: DimItem;
  socketOverrides: SocketOverrides;
  onAccept(overrides: SocketOverrides): void;
  onClose(): void;
}) {
  const defs = useD2Definitions();
  const profileResponse = useSelector(profileResponseSelector);

  const { initiallySelected, plugSets, aspects, fragments, sortPlugs, sortPlugGroups } =
    useMemo(() => {
      const initiallySelected = Object.values(socketOverrides)
        .map((hash) => defs!.InventoryItem.get(hash))
        .filter(isPluggableItem);

      const { plugSets, aspects, fragments } = getPlugsForSubclass(defs, profileResponse, subclass);

      for (const plugSet of plugSets) {
        if (
          plugSet.selectionType === 'single' &&
          _.intersectionBy(plugSet.plugs, initiallySelected, (plug) => plug.hash).length === 0
        ) {
          initiallySelected.push(plugSet.defaultPlug);
        }
      }

      // A flat list of possible subclass plugs we use this to figure out how to sort plugs
      // and the different sections in the plug picker
      const flatPlugs = plugSets.flatMap((set) => set.plugs);
      const sortPlugs = compareBy((plug: PluggableInventoryItemDefinition) =>
        flatPlugs.indexOf(plug)
      );
      // This ensures the plug groups are ordered by the socket order in the item def.
      // The order in the item def matches the order displayed in the game.
      const sortPlugGroups = compareBy(
        (group: PlugSet) => group.plugs.length && flatPlugs.indexOf(group.plugs[0])
      );
      return {
        initiallySelected,
        plugSets,
        aspects,
        fragments,
        sortPlugs,
        sortPlugGroups,
      };
    }, [defs, profileResponse, socketOverrides, subclass]);

  // The handler when when a user accepts the selection in the plug picker
  // This will create a new set of socket overrides
  const onAcceptInternal = useCallback(
    (selected: PluggableInventoryItemDefinition[]) => {
      if (!subclass.sockets) {
        return;
      }

      const remainingPlugs = Array.from(selected);
      const newOverrides: SocketOverrides = {};

      for (const socket of subclass.sockets.allSockets) {
        const socketPlugsetHashes = getPlugHashesForSocket(socket, profileResponse);
        for (const [index, plug] of remainingPlugs.entries()) {
          if (socketPlugsetHashes.some((hash) => hash === plug.hash)) {
            newOverrides[socket.socketIndex] = plug.hash;
            remainingPlugs.splice(index, 1);
            break;
          }
        }
      }
      onAccept(newOverrides);
    },
    [onAccept, profileResponse, subclass.sockets]
  );

  // Determines whether an ability, aspect or fragment is currently selectable
  // - Any: only a single instace can be selected at a time
  // - Ability: Only a single ability can be selected at a time.
  // - Fragments: the energy level of the aspects determines the number that can be selected
  // - Aspects: A maximum of 2 can be selected.
  const isPlugSelectable = useCallback(
    (plug: PluggableInventoryItemDefinition, selected: PluggableInventoryItemDefinition[]) => {
      if (selected.some((s) => s.hash === plug.hash)) {
        return false;
      }

      // Fragments handling
      const selectedAspects = selected.filter((plugDef) => aspects.has(plugDef));
      const selectedFragments = selected.filter((plugDef) => fragments.has(plugDef));
      const allowedFragments = _.sumBy(
        selectedAspects,
        (aspect) =>
          aspect.investmentStats.find(
            (stat) => stat.statTypeHash === StatHashes.AspectEnergyCapacity
          )?.value || 0
      );
      if (fragments.has(plug)) {
        return selectedFragments.length < allowedFragments;
      }

      return true;
    },
    [aspects, fragments]
  );

  return (
    <PlugDrawer
      title={t('Loadouts.SubclassOptions', { subclass: subclass.name })}
      searchPlaceholder={t('Loadouts.SubclassOptionsSearch', { subclass: subclass.name })}
      acceptButtonText={t('Loadouts.Apply')}
      plugSets={plugSets}
      displayedStatHashes={DISPLAYED_PLUG_STATS}
      onAccept={onAcceptInternal}
      onClose={onClose}
      isPlugSelectable={isPlugSelectable}
      sortPlugs={sortPlugs}
      sortPlugGroups={sortPlugGroups}
      initiallySelected={initiallySelected}
    />
  );
}

/**
 * This creates the the plugSets for the plug picker and also creates sets
 * of aspect and fragment plugs.
 */
function getPlugsForSubclass(
  defs: D2ManifestDefinitions | undefined,
  profileResponse: DestinyProfileResponse | undefined,
  subclass: DimItem
) {
  const plugSets: PlugSetWithDefaultPlug[] = [];
  const aspects: Set<PluggableInventoryItemDefinition> = new Set();
  const fragments: Set<PluggableInventoryItemDefinition> = new Set();

  if (!subclass.sockets || !defs) {
    return { plugSets, aspects, fragments };
  }

  for (const category of subclass.sockets.categories) {
    const sockets = getSocketsByCategoryHash(subclass.sockets, category.category.hash);
    // Group sockets by their plugSetHash so that we can figure out how many aspect or ability
    // choices the user will get
    const socketsGroupedBySetHash = _.groupBy(
      sockets,
      (socket) => socket.socketDefinition.reusablePlugSetHash
    );

    for (const socketGroup of Object.values(socketsGroupedBySetHash)) {
      if (socketGroup.length) {
        const firstSocket = socketGroup[0];
        const plugSetHash = firstSocket.socketDefinition.reusablePlugSetHash;
        const defaultPlugHash = getDefaultPlugHash(firstSocket, defs);
        const defaultPlug = defaultPlugHash ? defs.InventoryItem.get(defaultPlugHash) : undefined;
        if (plugSetHash && profileResponse && isPluggableItem(defaultPlug)) {
          const plugSet: PlugSetWithDefaultPlug = {
            plugs: [],
            plugSetHash,
            maxSelectable: socketGroup.length,
            defaultPlug,
            selectionType:
              category.category.hash === SocketCategoryHashes.Abilities ? 'single' : 'multi',
          };
          // Get all the availabe plugs for the given profile
          // TODO (ryan) use itemsForCharacterOrProfilePlugSet, atm there will be no difference
          // but it should future proof things
          const plugHashes = itemsForPlugSetEverywhere(profileResponse, plugSetHash).map(
            (plug) => plug.plugItemHash
          );

          for (const hash of plugHashes) {
            const plugDef = defs.InventoryItem.get(hash);
            const isAspect = category.category.hash === SocketCategoryHashes.Aspects;
            const isFragment = category.category.hash === SocketCategoryHashes.Fragments;
            const isEmptySocket =
              (isAspect || isFragment) &&
              hash === firstSocket.socketDefinition.singleInitialItemHash;

            if (!isEmptySocket && isPluggableItem(plugDef)) {
              plugSet.plugs.push(plugDef);

              if (isAspect) {
                aspects.add(plugDef);
              } else if (isFragment) {
                fragments.add(plugDef);
              }
            }
          }
          plugSet.plugs = _.uniqBy(plugSet.plugs, (plug) => plug.hash);
          plugSets.push(plugSet);
        }
      }
    }
  }
  return { plugSets, aspects, fragments };
}

function getPlugHashesForSocket(
  socket: DimSocket,
  profileResponse: DestinyProfileResponse | undefined
) {
  const plugSetHash = socket?.socketDefinition.reusablePlugSetHash;

  if (!plugSetHash || !profileResponse) {
    return [];
  }

  return itemsForPlugSetEverywhere(profileResponse, plugSetHash).map((plug) => plug.plugItemHash);
}
