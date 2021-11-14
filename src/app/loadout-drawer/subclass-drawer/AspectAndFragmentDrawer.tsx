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
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

// Hacky way to get the subclass abilities and fragments in roughly the right order.
// Works because aspects and fragments have the most plugs
const sortPlugGroups = compareBy((group: PluggableInventoryItemDefinition[]) => group.length);

export default function AspectAndFragmentDrawer({
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

  const { initiallySelected, plugs } = useMemo(() => {
    const initiallySelected = Object.values(socketOverrides)
      .map((hash) => defs?.InventoryItem.get(hash))
      .filter(isPluggableItem);

    return {
      initiallySelected,
      plugs: getPlugsForSubclass(defs, profileResponse, subclass),
    };
  }, [defs, profileResponse, socketOverrides, subclass]);

  const onAcceptInternal = useCallback(
    (selected: PluggableInventoryItemDefinition[]) => {
      if (!subclass.sockets) {
        return;
      }

      const remainingPlugs = [...selected];
      const newOverrides: SocketOverrides = {};

      for (const socket of subclass.sockets.allSockets) {
        for (const [index, plug] of remainingPlugs.entries()) {
          if (socket.plugOptions.some((option) => option.plugDef.hash === plug.hash)) {
            newOverrides[socket.socketIndex] = plug.hash;
            remainingPlugs.splice(index, 1);
            break;
          }
        }
      }
      onAccept(newOverrides);
    },
    [onAccept, subclass.sockets]
  );

  // Determines whether an aspect of fragment is currently selectable
  // - Both: only a single instace can be selected at a time
  // - Fragments: the energy level of the aspects determines the number that can be selected
  // - Aspects: A maximum of 2 can be selected.
  const isPlugSelectable = useCallback(
    (plug: PluggableInventoryItemDefinition, selected: PluggableInventoryItemDefinition[]) =>
      !selected.some((s) => s.hash === plug.hash),
    []
  );

  return (
    <PlugDrawer
      title={t('Loadouts.AspectsAndFragments')}
      searchPlaceholder={t('Loadouts.SearchAspectsAndFragments')}
      acceptButtonText={t('Loadouts.Apply')}
      language={language}
      plugs={plugs}
      onAccept={onAcceptInternal}
      onClose={onClose}
      isPlugSelectable={isPlugSelectable}
      sortPlugGroups={sortPlugGroups}
      initiallySelected={initiallySelected}
    />
  );
}

function getPlugsForSubclass(
  defs: D2ManifestDefinitions | undefined,
  profileResponse: DestinyProfileResponse | undefined,
  subclass: DimItem
) {
  if (!subclass.sockets || !defs) {
    return [];
  }

  const plugs: Set<PluggableInventoryItemDefinition> = new Set();

  for (const category of subclass.sockets.categories) {
    const sockets = getSocketsByCategoryHash(subclass.sockets, category.category.hash);

    for (const socket of sockets) {
      for (const hash of getPlugHashesForSocket(socket, profileResponse)) {
        const plugDef = defs.InventoryItem.get(hash);
        const isEmptySocket =
          (category.category.hash === SocketCategoryHashes.Aspects ||
            category.category.hash === SocketCategoryHashes.Fragments) &&
          hash === socket.socketDefinition.singleInitialItemHash;
        if (!isEmptySocket && isPluggableItem(plugDef)) {
          plugs.add(plugDef);
        }
      }
    }
  }
  return Array.from(plugs);
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
