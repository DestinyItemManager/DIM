import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import PlugDrawer from 'app/loadout/plug-drawer/PlugDrawer';
import { PlugSelectionType, PlugSet } from 'app/loadout/plug-drawer/types';
import { useD2Definitions } from 'app/manifest/selectors';
import { uniqBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { useCallback, useMemo } from 'react';

const EMPTY_MOD = 1235188590;
const RESET_MOD = 3967741860;
const RESET_SOCKET = 1383699646;
const excludedMods = [EMPTY_MOD, RESET_MOD];

export default function ArtifactPlugDrawer({
  artifact,
  socketOverrides,
  onAccept,
  onClose,
}: {
  artifact: DimItem;
  socketOverrides: SocketOverrides;
  onAccept: (overrides: SocketOverrides) => void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const sortPlugGroups = compareBy((group: PlugSet) => group.plugs.length);

  const { plugSets, plugCounts } = useMemo(
    () => getPlugsForArtifact(defs, artifact, socketOverrides),
    [defs, artifact, socketOverrides],
  );

  const handleAccept = useCallback(
    (selected: PluggableInventoryItemDefinition[]) => {
      if (!artifact.sockets) {
        return;
      }

      const newOverrides: SocketOverrides = {};
      let remainingPlugs = Array.from(selected);

      for (const socket of artifact.sockets.allSockets) {
        if (!socket.plugSet && socket.socketDefinition.socketTypeHash !== RESET_SOCKET) {
          continue;
        }

        const matchingPlug = remainingPlugs.find((plug) =>
          socket.plugSet?.plugs.some((option) => option.plugDef.hash === plug.hash),
        );

        if (matchingPlug) {
          newOverrides[socket.socketIndex] = matchingPlug.hash;
          remainingPlugs = remainingPlugs.filter((plug) => plug.hash !== matchingPlug.hash);
        }
        // TODO might need to save empty mod here and in sync-from-equipped if not matching
      }

      onAccept(newOverrides);
    },
    [artifact.sockets, onAccept],
  );

  return (
    <PlugDrawer
      title={t('Loadouts.SubclassOptions', { subclass: artifact.name })}
      searchPlaceholder={t('Loadouts.SubclassOptionsSearch', { subclass: artifact.name })}
      acceptButtonText={t('Loadouts.Apply')}
      plugSets={plugSets}
      classType={artifact.classType}
      onAccept={handleAccept}
      onClose={onClose}
      sortPlugGroups={sortPlugGroups}
      isPlugSelectable={(plug, selected) =>
        !selected.find((s) => s.hash === plug.hash) &&
        plugCounts[plug.hash] >
          selected.filter((s) => plugCounts[s.hash] <= plugCounts[plug.hash]).length
      }
    />
  );
}

function getPlugsForArtifact(
  defs: D2ManifestDefinitions | undefined,
  artifact: DimItem,
  socketOverrides: SocketOverrides,
) {
  if (!artifact.sockets || !defs) {
    return { plugSets: [], plugCounts: {} };
  }

  const artifactSockets = artifact.sockets.allSockets.filter(
    (socket) => socket.plugSet && socket.socketDefinition.socketTypeHash !== RESET_SOCKET,
  );

  if (artifactSockets.length === 0) {
    return { plugSets: [], plugCounts: {} };
  }

  const plugCounts = artifactSockets.reduce(
    (counts, socket) => {
      for (const dimPlug of socket.plugSet!.plugs) {
        const plugHash = dimPlug.plugDef.hash;
        if (!excludedMods.includes(plugHash)) {
          counts[plugHash] = (counts[plugHash] || 0) + 1;
        }
      }
      return counts;
    },
    {} as Record<number, number>,
  );
  const biggestSocket = artifactSockets.reduce(
    (biggest, socket) =>
      socket.plugSet!.plugs.length > biggest.plugSet!.plugs.length ? socket : biggest,
    artifactSockets[0],
  );

  const plugSetHash =
    biggestSocket.socketDefinition.reusablePlugSetHash ?? biggestSocket.plugSet!.hash;
  const plugSet: PlugSet = {
    plugs: [],
    selected: [],
    plugSetHash,
    maxSelectable: artifactSockets.length,
    selectionType: PlugSelectionType.Unique,
  };

  plugSet.plugs = uniqBy(
    biggestSocket
      .plugSet!.plugs.filter((dimPlug) => !excludedMods.includes(dimPlug.plugDef.hash))
      .map((dimPlug) => dimPlug.plugDef),
    (plug) => plug.hash,
  );

  for (const socket of artifactSockets) {
    const overrideHash = socketOverrides[socket.socketIndex];
    if (overrideHash) {
      const initialPlug = plugSet.plugs.find((plug) => plug.hash === overrideHash);
      if (initialPlug) {
        plugSet.selected.push(initialPlug);
      }
    }
  }

  return { plugSets: [plugSet], plugCounts };
}
