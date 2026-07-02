import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
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

  const { plugSets, sortPlugGroups } = useMemo(() => {
    const { plugSets } = getPlugsForArtifact(defs, artifact, socketOverrides);

    const flatPlugs = plugSets.flatMap((set) => set.plugs);
    const sortPlugGroups = compareBy(
      (group: PlugSet) => group.plugs.length && flatPlugs.indexOf(group.plugs[0]),
    );

    return { plugSets, sortPlugGroups };
  }, [artifact, defs, socketOverrides]);

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
      isPlugSelectable={(plug, selected) => {
        const selectedHashes = new Set(selected.map((s) => s.hash));
        return !selectedHashes.has(plug.hash);
      }}
    />
  );
}

function getPlugsForArtifact(
  defs: D2ManifestDefinitions | undefined,
  artifact: DimItem,
  socketOverrides: SocketOverrides,
) {
  const plugSets: PlugSet[] = [];

  if (!artifact.sockets || !defs) {
    return { plugSets };
  }

  const artifactSockets = artifact.sockets.allSockets.filter((socket) => socket.plugSet);

  const groupedSockets = new Map<number, DimSocket[]>();
  const groupOrder: number[] = [];
  for (const socket of artifactSockets) {
    const groupHash = socket.socketDefinition.reusablePlugSetHash ?? socket.plugSet!.hash;
    if (!groupedSockets.has(groupHash)) {
      groupedSockets.set(groupHash, []);
      groupOrder.push(groupHash);
    }
    groupedSockets.get(groupHash)!.push(socket);
  }

  const socketGroups = groupOrder.map((groupHash) => groupedSockets.get(groupHash)!);

  for (const socketGroup of socketGroups) {
    const firstSocket = socketGroup[0];
    const plugSetHash =
      firstSocket.socketDefinition.reusablePlugSetHash ?? firstSocket.plugSet!.hash;
    const plugSet: PlugSet = {
      plugs: [],
      selected: [],
      plugSetHash,
      maxSelectable: socketGroup.length,
      selectionType: PlugSelectionType.Multi,
    };

    plugSet.plugs = uniqBy(
      firstSocket
        .plugSet!.plugs.filter((dimPlug) => !excludedMods.includes(dimPlug.plugDef.hash))
        .map((dimPlug) => dimPlug.plugDef),
      (plug) => plug.hash,
    );

    for (const socket of socketGroup) {
      const overrideHash = socketOverrides[socket.socketIndex];
      if (overrideHash) {
        const initialPlug = plugSet.plugs.find((plug) => plug.hash === overrideHash);
        if (initialPlug) {
          plugSet.selected.push(initialPlug);
        }
      }
    }

    plugSets.push(plugSet);
  }

  return { plugSets };
}
