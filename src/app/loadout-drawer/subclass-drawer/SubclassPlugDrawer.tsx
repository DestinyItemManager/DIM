import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import PlugDrawer from 'app/loadout/plug-drawer/PlugDrawer';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { compareBy } from 'app/utils/comparators';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

// We could probably compute this but I am doubtful bungie will change it to be more
// than 2
const MAX_ASPECTS = 2;

const DISPLAYED_PLUG_STATS = [StatHashes.AspectEnergyCapacity];

// Hacky way to get the subclass abilities and fragments in roughly the right order.
// Works because aspects and fragments have the most plugs.
// TODO (ryan) sort by socket index
const sortPlugGroups = compareBy((group: PluggableInventoryItemDefinition[]) => group.length);

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

  const { initiallySelected, plugs, aspects, fragments } = useMemo(() => {
    const initiallySelected = Object.values(socketOverrides)
      .map((hash) => defs?.InventoryItem.get(hash))
      .filter(isPluggableItem);
    const { plugs, aspects, fragments } = getPlugsForSubclass(defs, profileResponse, subclass);
    return {
      initiallySelected,
      plugs: Array.from(plugs),
      aspects,
      fragments,
    };
  }, [defs, profileResponse, socketOverrides, subclass]);

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

      // Aspects handling
      const selectedAspects = selected.filter((plugDef) => aspects.has(plugDef));
      if (aspects.has(plug)) {
        return selectedAspects.length < MAX_ASPECTS;
      }

      // Fragments handling
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
      title={t('Loadouts.AspectsAndFragments')}
      searchPlaceholder={t('Loadouts.SearchAspectsAndFragments')}
      acceptButtonText={t('Loadouts.Apply')}
      language={language}
      plugs={plugs}
      displayedStatHashes={DISPLAYED_PLUG_STATS}
      onAccept={onAcceptInternal}
      onClose={onClose}
      isPlugSelectable={isPlugSelectable}
      sortPlugGroups={sortPlugGroups}
      initiallySelected={initiallySelected}
    />
  );
}

export function getPlugsForSubclass(
  defs: D2ManifestDefinitions | undefined,
  profileResponse: DestinyProfileResponse | undefined,
  subclass: DimItem
) {
  const plugs = new Set<PluggableInventoryItemDefinition>();
  const aspects: Set<PluggableInventoryItemDefinition> = new Set();
  const fragments: Set<PluggableInventoryItemDefinition> = new Set();

  if (!subclass.sockets || !defs) {
    return { plugs, aspects, fragments };
  }

  for (const category of subclass.sockets.categories) {
    const sockets = getSocketsByCategoryHash(subclass.sockets, category.category.hash);

    for (const socket of sockets) {
      for (const hash of getPlugHashesForSocket(socket, profileResponse)) {
        const plugDef = defs.InventoryItem.get(hash);
        const isAspect = category.category.hash === SocketCategoryHashes.Aspects;
        const isFragment = category.category.hash === SocketCategoryHashes.Fragments;
        const isEmptySocket =
          (isAspect || isFragment) && hash === socket.socketDefinition.singleInitialItemHash;

        if (!isEmptySocket && isPluggableItem(plugDef)) {
          plugs.add(plugDef);

          if (isAspect) {
            aspects.add(plugDef);
          } else if (isFragment) {
            fragments.add(plugDef);
          }
        }
      }
    }
  }
  return { plugs, aspects, fragments };
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
