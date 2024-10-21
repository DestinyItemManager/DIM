import { profileResponseSelector } from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { SHADER_NODE } from 'app/search/d2-known-values';
import { DestinyCollectibleState, DestinyPresentationNodeDefinition } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { getCollectibleState } from './presentation-nodes';

// A set containing shaders that are displayed in collections for any character.
export const collectionsVisibleShadersSelector = createSelector(
  d2ManifestSelector,
  profileResponseSelector,
  (defs, profileResponse) => {
    if (!defs || !profileResponse) {
      return undefined;
    }

    const getVisibleCollectibles = (node: DestinyPresentationNodeDefinition): number[] => {
      const visibleCollectibles: number[] = node.children.collectibles
        .map((c) => defs.Collectible.get(c.collectibleHash))
        .filter((c) => {
          const state = getCollectibleState(c, profileResponse);
          return state !== undefined && !(state & DestinyCollectibleState.Invisible) && !c.redacted;
        })
        .map((c) => c.itemHash);
      const visibleChildCollectibles = node.children.presentationNodes.flatMap((childNode) =>
        getVisibleCollectibles(defs.PresentationNode.get(childNode.presentationNodeHash)),
      );
      return visibleChildCollectibles.concat(visibleCollectibles);
    };

    return new Set(getVisibleCollectibles(defs.PresentationNode.get(SHADER_NODE)));
  },
);
