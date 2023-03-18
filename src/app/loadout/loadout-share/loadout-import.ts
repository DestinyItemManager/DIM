import { defaultLoadoutParameters, LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { getSharedLoadout } from 'app/dim-api/dim-api';
import { generateMissingLoadoutItemId } from 'app/loadout-drawer/loadout-item-conversion';
import { convertDimApiLoadoutToLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout } from 'app/loadout-drawer/loadout-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { v4 as uuidv4 } from 'uuid';

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
    } else if (pathname.endsWith('/optimizer')) {
      const params = decodeUrlLoadoutParameters(search);
      if (params.classType !== undefined || params.notes || params.parameters || params.query) {
        return { tag: 'urlParameters', urlParameters: params };
      }
    }
  } catch {}
}

/**
 * Decode the deprecated Loadout Optimizer links containing only Loadout Optimizer settings.
 * `search` is the URL query string beginning with ?.
 */
export function decodeUrlLoadoutParameters(search: string): UrlLoadoutParameters {
  const searchParams = new URLSearchParams(search);
  const urlClassTypeString = searchParams.get('class');
  const urlLoadoutParametersJSON = searchParams.get('p');
  const notes = searchParams.get('n') ?? undefined;

  const classType = urlClassTypeString ? parseInt(urlClassTypeString) : undefined;

  let query = '';
  let parameters: LoadoutParameters | undefined;
  if (urlLoadoutParametersJSON) {
    parameters = JSON.parse(urlLoadoutParametersJSON);
    parameters = { ...defaultLoadoutParameters, ...parameters };
    if (parameters?.query) {
      query = parameters.query;
    }
  }

  return {
    parameters,
    classType,
    notes,
    query,
  };
}

/**
 * Decode the links to the Loadouts page containing full shared loadouts.
 * Throws on error.
 */
export function decodeUrlLoadout(search: string): Loadout | undefined {
  const searchParams = new URLSearchParams(search);
  const loadoutJSON = searchParams.get('loadout');
  if (loadoutJSON) {
    return preprocessReceivedLoadout(convertDimApiLoadoutToLoadout(JSON.parse(loadoutJSON)));
  }
}

async function getDimSharedLoadout(shareId: string) {
  const loadout = await getSharedLoadout(shareId);
  return preprocessReceivedLoadout(convertDimApiLoadoutToLoadout(loadout));
}

/**
 * Ensure received loadouts and their items have a unique ID.
 */
function preprocessReceivedLoadout(loadout: Loadout): Loadout {
  loadout.id = uuidv4();
  loadout.items = loadout.items.map((item) => ({
    ...item,
    id:
      item.id === '0'
        ? // We don't save consumables in D2 loadouts, but we may omit ids in shared loadouts
          // (because they'll never match someone else's inventory). So
          // instead, pick an ID.
          generateMissingLoadoutItemId()
        : item.id,
  }));

  return loadout;
}
