import { Loadout as DimApiLoadout, LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { getSharedLoadout } from 'app/dim-api/dim-api';
import { generateMissingLoadoutItemId } from 'app/loadout-drawer/loadout-item-conversion';
import { newLoadout } from 'app/loadout-drawer/loadout-utils';
import { convertDimApiLoadoutToLoadout } from 'app/loadout/loadout-type-converters';
import { Loadout } from 'app/loadout/loadout-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { clamp } from 'es-toolkit';
import { MAX_STAT, MAX_TIER } from '../known-values';
// A very permissive regex that allows directly pasted URLs, but also various ways in which
// people might type it manually (such as a URL-like string with a missing protocol or just the share ID)
// Hardcoding the lower limit of 7 characters so that a user typing the characters manually doesn't call
// the API 7 times.
const dimGGLoadoutShare = /^(?:(?:https?:\/\/)?dim.gg\/)?([a-z0-9]{7,})(?:\/.*)?$/;

export interface UrlLoadoutParameters {
  parameters?: LoadoutParameters;
  notes?: string;
  classType?: DestinyClass;
  query?: string;
}

export type DecodedShareLink =
  | {
      tag: 'dimGGShare';
      shareId: string;
    }
  | {
      tag: 'urlLoadout';
      loadout: Loadout;
    }
  | {
      tag: 'urlParameters';
      urlParameters: UrlLoadoutParameters;
    };

export async function getDecodedLoadout(decodedUrl: DecodedShareLink): Promise<Loadout> {
  switch (decodedUrl.tag) {
    case 'dimGGShare': {
      const loadout = await getDimSharedLoadout(decodedUrl.shareId);
      return loadout;
    }
    case 'urlLoadout':
      return decodedUrl.loadout;
    case 'urlParameters': {
      const { classType, notes, parameters } = decodedUrl.urlParameters;
      const loadout = newLoadout('', [], classType);
      loadout.notes = notes;
      loadout.parameters = parameters;
      return loadout;
    }
  }
}

/**
 * Decode any URL that could be used to share a loadout with DIM.
 */
export function decodeShareUrl(shareUrl: string): DecodedShareLink | undefined {
  const dimGGMatch = shareUrl.match(dimGGLoadoutShare);
  if (dimGGMatch) {
    return { tag: 'dimGGShare', shareId: dimGGMatch[1] };
  }
  try {
    const { pathname, search } = new URL(shareUrl);
    if (pathname.endsWith('/loadouts')) {
      const loadout = decodeUrlLoadout(search);
      if (loadout) {
        return { tag: 'urlLoadout', loadout };
      }
    }
  } catch {}
}

/**
 * Decode the links to the Loadouts page containing full shared loadouts.
 * Throws on error.
 */
export function decodeUrlLoadout(search: string): Loadout | undefined {
  const searchParams = new URLSearchParams(search);
  const loadoutJSON = searchParams.get('loadout');
  if (loadoutJSON) {
    return preprocessReceivedLoadout(
      convertDimApiLoadoutToLoadout(JSON.parse(loadoutJSON) as DimApiLoadout),
    );
  }
}

async function getDimSharedLoadout(shareId: string) {
  const loadout = await getSharedLoadout(shareId);
  return preprocessReceivedLoadout(convertDimApiLoadoutToLoadout(loadout));
}

/**
 * Ensure received loadouts and their items have a unique ID, and that stat
 * constraints are in the correct range.
 */
function preprocessReceivedLoadout(loadout: Loadout): Loadout {
  loadout.id = globalThis.crypto.randomUUID();
  loadout.items = loadout.items.map((item) => ({
    ...item,
    id: item.id === '0' ? generateMissingLoadoutItemId() : item.id,
    hash: Number(item.hash),
  }));
  for (const constraint of loadout.parameters?.statConstraints ?? []) {
    // min/maxTier are deprecated as of Edge of Fate, but we still support them
    // for backwards compatibility.
    if (constraint.maxTier !== undefined) {
      constraint.maxTier = clamp(constraint.maxTier, 0, MAX_TIER);
    }
    if (constraint.minTier !== undefined) {
      // For min tier, make sure it is not greater than the max tier.
      constraint.minTier = clamp(constraint.minTier, 0, constraint.maxTier ?? MAX_TIER);
    }

    // max/minStat replace min/maxTier in Edge of Fate to allow expressing exact
    // stat goals.
    if (constraint.maxStat !== undefined) {
      constraint.maxStat = clamp(constraint.maxStat, 0, MAX_STAT);
    }
    if (constraint.minStat !== undefined) {
      // For min tier, make sure it is not greater than the max tier.
      constraint.minStat = clamp(constraint.minStat, 0, constraint.maxStat ?? MAX_STAT);
    }
  }

  return loadout;
}
