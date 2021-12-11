import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import PlugDrawer, { PlugsWithMaxSelectable } from 'app/loadout/plug-drawer/PlugDrawer';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { compareBy } from 'app/utils/comparators';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

const DISPLAYED_PLUG_STATS = [StatHashes.AspectEnergyCapacity];

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
  const language = useSelector(languageSelector);
  const defs = useD2Definitions();
  const profileResponse = useSelector(profileResponseSelector);

  const {
    initiallySelected,
    plugsWithMaxSelectableSets,
    aspects,
    fragments,
    sortPlugs,
    sortPlugGroups,
  } = useMemo(() => {
    const initiallySelected = Object.values(socketOverrides)
      .map((hash) => defs?.InventoryItem.get(hash))
      .filter(isPluggableItem);
    const { plugsWithMaxSelectableSets, aspects, fragments } = getPlugsForSubclass(
      defs,
      profileResponse,
      subclass
    );
    // A flat list of possible subclass plugs we use this to figure out how to sort plugs
    // and the different sections in the plug picker
    const flatPlugs = plugsWithMaxSelectableSets.flatMap((set) => set.plugs);
    const sortPlugs = compareBy((plug: PluggableInventoryItemDefinition) =>
      flatPlugs.indexOf(plug)
    );

    // The grouping we use in the plug drawer breaks the plug ordering, this puts the groups in the
    // correct order again as we build the set of plugs by iterating the categories in order
    const sortPlugGroups = compareBy(
      (group: PlugsWithMaxSelectable) => group.plugs.length && flatPlugs.indexOf(group.plugs[0])
    );
    return {
      initiallySelected,
      plugsWithMaxSelectableSets,
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

      // Abilities handling
      if (!aspects.has(plug) && !fragments.has(plug)) {
        // TODO (ryan) this is annoying as you cannot just click a different ability to auto
        // deselect the current one. We should come up with a way to allow swapping by a single
        // click
        return !selected.some((s) => s.plug.plugCategoryHash === plug.plug.plugCategoryHash);
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
      language={language}
      plugsWithMaxSelectableSets={plugsWithMaxSelectableSets}
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
 * This creates the the plugsWithMaxSelectableSets for the plug picker and also creates sets
 * of aspect and fragment plugs.
 */
function getPlugsForSubclass(
  defs: D2ManifestDefinitions | undefined,
  profileResponse: DestinyProfileResponse | undefined,
  subclass: DimItem
) {
  const plugsWithMaxSelectableSets: PlugsWithMaxSelectable[] = [];
  const aspects: Set<PluggableInventoryItemDefinition> = new Set();
  const fragments: Set<PluggableInventoryItemDefinition> = new Set();

  if (!subclass.sockets || !defs) {
    return { plugsWithMaxSelectableSets, aspects, fragments };
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

        if (plugSetHash && profileResponse) {
          const plugsWithMaxSelectable: PlugsWithMaxSelectable = {
            plugs: [],
            plugSetHash,
            maxSelectable: socketGroup.length,
          };
          // Get all the availabe plugs for the given profile
          const plugHashes = itemsForPlugSet(profileResponse, plugSetHash).map(
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
              plugsWithMaxSelectable.plugs.push(plugDef);

              if (isAspect) {
                aspects.add(plugDef);
              } else if (isFragment) {
                fragments.add(plugDef);
              }
            }
          }
          plugsWithMaxSelectable.plugs = _.uniqBy(
            plugsWithMaxSelectable.plugs,
            (plug) => plug.hash
          );
          plugsWithMaxSelectableSets.push(plugsWithMaxSelectable);
        }
      }
    }
  }
  return { plugsWithMaxSelectableSets, aspects, fragments };
}

function getPlugHashesForSocket(
  socket: DimSocket,
  profileResponse: DestinyProfileResponse | undefined
) {
  const plugSetHash = socket?.socketDefinition.reusablePlugSetHash;

  if (!plugSetHash || !profileResponse) {
    return [];
  }

  return itemsForPlugSet(profileResponse, plugSetHash).map((plug) => plug.plugItemHash);
}
