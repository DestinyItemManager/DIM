import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import PlugDrawer from 'app/loadout/plug-drawer/PlugDrawer';
import { PlugSelectionType, PlugSet } from 'app/loadout/plug-drawer/types';
import { useD2Definitions } from 'app/manifest/selectors';
import { sumBy, uniqBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  getDefaultAbilityChoiceHash,
  getSocketsByCategoryHash,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import { objectValues } from 'app/utils/util-types';
import { StatHashes } from 'data/d2/generated-enums';
import { useCallback, useMemo } from 'react';

type PlugSetWithDefaultPlug = PlugSet & { defaultPlug: PluggableInventoryItemDefinition };

/**
 * A customized PlugDrawer for showing mod choices for mod-style subclasses (subclasses 3.0, the first of which was Stasis).
 */
export default function SubclassPlugDrawer({
  subclass,
  socketOverrides,
  onAccept,
  onClose,
}: {
  subclass: DimItem;
  socketOverrides: SocketOverrides;
  onAccept: (overrides: SocketOverrides) => void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;

  const { plugSets, sortPlugGroups } = useMemo(() => {
    const initiallySelected = objectValues(socketOverrides)
      .map((hash) => defs.InventoryItem.get(hash))
      .filter(isPluggableItem);

    const { plugSets } = getPlugsForSubclass(defs, subclass, initiallySelected);

    // A flat list of possible subclass plugs we use this to figure out how to sort plugs
    // and the different sections in the plug picker
    const flatPlugs = plugSets.flatMap((set) => set.plugs);
    // This ensures the plug groups are ordered by the socket order in the item def.
    // The order in the item def matches the order displayed in the game.
    const sortPlugGroups = compareBy(
      (group: PlugSet) => group.plugs.length && flatPlugs.indexOf(group.plugs[0]),
    );
    return {
      plugSets,
      sortPlugGroups,
    };
  }, [defs, socketOverrides, subclass]);

  // The handler when when a user accepts the selection in the plug picker
  // This will create a new set of socket overrides
  const handleAccept = useCallback(
    (selected: PluggableInventoryItemDefinition[]) => {
      if (!subclass.sockets) {
        return;
      }

      const remainingPlugs = Array.from(selected);
      const newOverrides: SocketOverrides = {};

      for (const socket of subclass.sockets.allSockets) {
        if (!socket.plugSet) {
          continue;
        }

        for (const [index, plug] of remainingPlugs.entries()) {
          if (socket.plugSet.plugs.some((plugOption) => plug.hash === plugOption.plugDef.hash)) {
            newOverrides[socket.socketIndex] = plug.hash;
            remainingPlugs.splice(index, 1);
            break;
          }
        }
      }
      onAccept(newOverrides);
    },
    [onAccept, subclass.sockets],
  );

  return (
    <PlugDrawer
      title={t('Loadouts.SubclassOptions', { subclass: subclass.name })}
      searchPlaceholder={t('Loadouts.SubclassOptionsSearch', { subclass: subclass.name })}
      acceptButtonText={t('Loadouts.Apply')}
      plugSets={plugSets}
      classType={subclass.classType}
      onAccept={handleAccept}
      onClose={onClose}
      sortPlugGroups={sortPlugGroups}
    />
  );
}

/**
 * This creates the the plugSets for the plug picker and also creates sets
 * of aspect and fragment plugs.
 */
function getPlugsForSubclass(
  defs: D2ManifestDefinitions | undefined,
  subclass: DimItem,
  initiallySelected: PluggableInventoryItemDefinition[],
) {
  const plugSets: PlugSetWithDefaultPlug[] = [];
  const aspects = new Set<PluggableInventoryItemDefinition>();
  const fragments = new Set<PluggableInventoryItemDefinition>();

  if (!subclass.sockets || !defs) {
    return { plugSets, aspects, fragments };
  }

  const getFragmentCapacity = (allSelectedPlugs: PluggableInventoryItemDefinition[]) =>
    sumBy(
      allSelectedPlugs.filter((p) => aspects.has(p)),
      (aspect) =>
        aspect.investmentStats.find((stat) => stat.statTypeHash === StatHashes.AspectEnergyCapacity)
          ?.value ?? 0,
    );

  for (const category of subclass.sockets.categories) {
    const sockets = getSocketsByCategoryHash(subclass.sockets, category.category.hash);
    // Group sockets by their plugSetHash so that we can figure out how many aspect or ability
    // choices the user will get
    const socketsGroupedBySetHash = Map.groupBy(
      sockets,
      (socket) => socket.socketDefinition.reusablePlugSetHash,
    );

    for (const socketGroup of socketsGroupedBySetHash.values()) {
      if (socketGroup.length) {
        const firstSocket = socketGroup[0];

        const isAbilityLikeSocket = subclassAbilitySocketCategoryHashes.includes(
          category.category.hash,
        );

        const isAspect = aspectSocketCategoryHashes.includes(category.category.hash);
        const isFragment = fragmentSocketCategoryHashes.includes(category.category.hash);

        const defaultPlugHash = isAbilityLikeSocket
          ? getDefaultAbilityChoiceHash(firstSocket)
          : firstSocket.emptyPlugItemHash;
        const defaultPlug = defaultPlugHash ? defs.InventoryItem.get(defaultPlugHash) : undefined;
        if (firstSocket.plugSet && isPluggableItem(defaultPlug)) {
          const plugSet: PlugSetWithDefaultPlug = {
            plugs: [],
            selected: [],
            plugSetHash: firstSocket.plugSet.hash,
            maxSelectable: isFragment ? getFragmentCapacity : socketGroup.length,
            defaultPlug,
            selectionType: isAbilityLikeSocket
              ? PlugSelectionType.Single
              : PlugSelectionType.Unique,
          };

          // In theory, subclass plugs are present in the profile response with
          // their unlock status:
          //  * canInsert,  enabled => unlocked
          //  * !canInsert, enabled => visible but locked
          //  * otherwise           => hidden
          //
          // But the data erroneously says the plugSets are profile-scoped, which means Bungie.net
          // will very often return this info not in the character plugs but only in the
          // profile plugs, and from the perspective an arbitrary character (different per player but seems to stay
          // that character. Maybe first created character?). This means we cannot trust `canInsert`,
          // since it reports some subclass plugs from the wrong character's perspective,
          // so we must inevitably show some locked stuff as unlocked. And at that point, we should consistently
          // show everything as unlocked.
          // Previously, this code at least filtered down to the list of plugs returned in profile+character plugs
          // (all of which are `enabled`), but for Stasis aspects specifically the plugSet in the profileResponse
          // for characters other than the aforementioned primary character doesn't even return them as `enabled`, so this
          // is why we just take the raw data from the plugSet and there's no kind of unlock check here.
          // See https://github.com/Bungie-net/api/issues/1572
          for (const dimPlug of firstSocket.plugSet.plugs) {
            const isEmptySocket =
              (isAspect || isFragment) && dimPlug.plugDef.hash === defaultPlugHash;

            if (!isEmptySocket) {
              plugSet.plugs.push(dimPlug.plugDef);

              if (isAspect) {
                aspects.add(dimPlug.plugDef);
              } else if (isFragment) {
                fragments.add(dimPlug.plugDef);
              }
            }
          }
          plugSet.plugs = uniqBy(plugSet.plugs, (plug) => plug.hash);

          plugSets.push(plugSet);
        }
      }
    }
  }

  // Populate the initial plugs of each set
  for (const initialPlug of initiallySelected) {
    const plugSet = plugSets.find((set) =>
      set.plugs.some((plug) => plug.hash === initialPlug.hash),
    );
    if (!plugSet) {
      continue;
    }
    plugSet.selected.push(initialPlug);
  }

  // If plug sets are for abilities we populate the default plug as selected.
  for (const plugSet of plugSets) {
    if (plugSet.selectionType === PlugSelectionType.Single && plugSet.selected.length === 0) {
      plugSet.selected.push(plugSet.defaultPlug);
    }
  }

  return { plugSets };
}
