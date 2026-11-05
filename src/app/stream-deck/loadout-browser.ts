import { getHashtagsFromString } from 'app/inventory/note-hashtags';
import { storesSelector } from 'app/inventory/selectors';
import { allInGameLoadoutsSelector } from 'app/loadout/ingame/selectors';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { sendToStreamDeck } from './async-module';
import { BrowserLoadout, HandlerArgs, RequestLoadoutsAction } from './interfaces';

/** Send only the metadata needed by the Stream Deck browser, never full loadouts. */
export function requestLoadoutsHandler({
  msg,
  state,
  store,
}: HandlerArgs<RequestLoadoutsAction>): ThunkResult {
  return async () => {
    const characters = storesSelector(state).filter((character) => !character.isVault);
    const defs = d2ManifestSelector(state);
    const loadouts: BrowserLoadout[] = [];
    for (const loadout of loadoutsSelector(state)) {
      const subclass = loadout.items.find(
        (item) =>
          defs?.InventoryItem.get(item.hash)?.inventory?.bucketTypeHash === BucketHashes.Subclass,
      );
      for (const character of characters) {
        if (
          loadout.classType !== DestinyClass.Unknown &&
          loadout.classType !== character.classType
        ) {
          continue;
        }
        loadouts.push({
          loadout: loadout.id,
          character: character.id,
          classType: character.classType,
          label: loadout.name,
          tags: getHashtagsFromString(loadout.name, loadout.notes),
          icon: subclass
            ? defs?.InventoryItem.get(subclass.hash)?.displayProperties.icon
            : undefined,
        });
      }
    }
    for (const loadout of allInGameLoadoutsSelector(state)) {
      const character = characters.find((character) => character.id === loadout.characterId);
      if (!character) {
        continue;
      }
      loadouts.push({
        loadout: loadout.id,
        character: character.id,
        classType: character.classType,
        label: `${loadout.index + 1}. ${loadout.name}`,
        tags: [],
        inGameIcon: { icon: loadout.icon, background: loadout.colorIcon },
      });
    }
    loadouts.sort((a, b) => a.label.localeCompare(b.label));
    sendToStreamDeck({
      action: 'loadouts',
      data: {
        device: msg.device,
        requestId: msg.requestId,
        currentCharacter: store.id,
        loadouts,
      },
    });
  };
}
