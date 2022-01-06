import { profileResponseSelector } from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { SHADER_NODE } from 'app/search/d2-known-values';
import { DestinyCollectibleState, DestinyPresentationNodeDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
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
        .map((c) => {
          const collectibleDef = defs.Collectible.get(c.collectibleHash);
          const state = getCollectibleState(collectibleDef, profileResponse);
          if (
            state === undefined ||
            state & DestinyCollectibleState.Invisible ||
            collectibleDef.redacted
          ) {
            return undefined;
          }
          return collectibleDef.itemHash;
        })
        .filter((i: number | undefined): i is number => Boolean(i));
      const visibleChildCollectibles = node.children.presentationNodes.flatMap((childNode) =>
        getVisibleCollectibles(defs.PresentationNode.get(childNode.presentationNodeHash))
      );
      return _.concat(visibleChildCollectibles, visibleCollectibles);
    };

    return new Set(getVisibleCollectibles(defs.PresentationNode.get(SHADER_NODE)));
  }
);
