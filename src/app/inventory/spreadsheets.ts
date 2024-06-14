import { currentAccountSelector } from 'app/accounts/selectors';
import { gaEvent } from 'app/google';
import { LoadoutsByItem, loadoutsByItemSelector } from 'app/loadout/selectors';
import { D1_StatHashes } from 'app/search/d1-known-values';
import D2Sources from 'app/search/items/search-filters/d2-sources';
import { dimArmorStatHashByName } from 'app/search/search-filter-values';
import { ThunkResult } from 'app/store/types';
import { filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { DimError } from 'app/utils/dim-error';
import { download } from 'app/utils/download';
import {
  getItemKillTrackerInfo,
  getItemYear,
  getMasterworkStatNames,
  getSpecialtySocketMetadatas,
  isD1Item,
  isKillTrackerSocket,
} from 'app/utils/item-utils';
import { getDisplayedItemSockets, getSocketsByIndexes } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import Papa from 'papaparse';
import { setItemNote, setItemTagsBulk } from './actions';
import { TagValue, tagConfig } from './dim-item-info';
import { D1GridNode, DimItem } from './item-types';
import { getNotesSelector, getTagSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import { getEvent, getSeason } from './store/season';

function getClass(type: DestinyClass) {
  switch (type) {
    case DestinyClass.Titan:
      return 'titan';
    case DestinyClass.Hunter:
      return 'hunter';
    case DestinyClass.Warlock:
      return 'warlock';
    case DestinyClass.Unknown:
      return 'unknown';
    case DestinyClass.Classified:
      return 'classified';
  }
}

const D1_FILTERED_NODE_HASHES = [
  1920788875, // Ascend
  1270552711, // Infuse
  2133116599, // Deactivate Chroma
  643689081, // Kinetic Damage
  472357138, // Void Damage
  1975859941, // Solar Damage
  2688431654, // Arc Damage
  1034209669, // Increase Intellect
  1263323987, // Increase Discipline
  913963685, // Reforge Shell
  193091484, // Increase Strength
  217480046, // Twist Fate
  191086989, // Reforge Artifact
  2086308543, // Upgrade Defense
  4044819214, // The Life Exotic
];
// ignore raid & calus sources in favor of more detailed sources
const sourceKeys = Object.keys(D2Sources).filter((k) => !['raid', 'calus'].includes(k));

export function generateCSVExportData(
  type: 'Weapons' | 'Armor' | 'Ghost',
  stores: DimStore[],
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  loadoutsByItem: LoadoutsByItem,
) {
  const nameMap: { [storeId: string]: string } = {};
  let allItems: DimItem[] = [];
  for (const store of stores) {
    allItems = allItems.concat(store.items);
    nameMap[store.id] =
      store.id === 'vault'
        ? 'Vault'
        : `${capitalizeFirstLetter(getClass(store.classType))}(${store.powerLevel})`;
  }
  allItems.sort(compareBy((item) => item.index));
  const items: DimItem[] = [];
  for (const item of allItems) {
    if (!item.primaryStat && type !== 'Ghost') {
      continue;
    }

    if (type === 'Weapons') {
      if (
        item.primaryStat?.statHash === D1_StatHashes.Attack ||
        item.primaryStat?.statHash === StatHashes.Attack
      ) {
        items.push(item);
      }
    } else if (type === 'Armor') {
      if (item.primaryStat?.statHash === StatHashes.Defense) {
        items.push(item);
      }
    } else if (type === 'Ghost' && item.bucket.hash === BucketHashes.Ghost) {
      items.push(item);
    }
  }

  switch (type) {
    case 'Weapons':
      return downloadWeapons(items, nameMap, getTag, getNotes, loadoutsByItem);
    case 'Armor':
      return downloadArmor(items, nameMap, getTag, getNotes, loadoutsByItem);
    case 'Ghost':
      return downloadGhost(items, nameMap, getTag, getNotes, loadoutsByItem);
  }
}

export function downloadCsvFiles(type: 'Weapons' | 'Armor' | 'Ghost'): ThunkResult {
  return async (_dispatch, getState) => {
    const stores = storesSelector(getState());
    const getTag = getTagSelector(getState());
    const getNotes = getNotesSelector(getState());
    const loadoutsForItem = loadoutsByItemSelector(getState());

    // perhaps we're loading
    if (stores.length === 0) {
      return;
    }
    const data = generateCSVExportData(type, stores, getTag, getNotes, loadoutsForItem);
    downloadCsv(`destiny${type}`, Papa.unparse(data));
  };
}

interface CSVRow {
  Loadouts: string;
  Notes: string;
  Tag: string;
  Hash: string;
  Id: string;
}

export function importTagsNotesFromCsv(files: File[]): ThunkResult<number | undefined> {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState());
    if (!account) {
      return;
    }

    let total = 0;

    for (const file of files) {
      const results = await new Promise<Papa.ParseResult<CSVRow>>((resolve, reject) =>
        Papa.parse(file, {
          header: true,
          complete: resolve,
          error: reject,
        }),
      );
      if (
        results.errors?.length &&
        !results.errors.every((e) => e.code === 'TooManyFields' || e.code === 'TooFewFields')
      ) {
        throw new Error(results.errors[0].message);
      }
      const contents = results.data;

      if (!contents?.length) {
        throw new DimError('Csv.EmptyFile');
      }

      const row = contents[0];
      if (!('Id' in row) || !('Hash' in row) || !('Tag' in row) || !('Notes' in row)) {
        throw new DimError('Csv.WrongFields');
      }

      dispatch(
        setItemTagsBulk(
          filterMap(contents, (row) => {
            if ('Id' in row && 'Hash' in row) {
              row.Tag = row.Tag.toLowerCase();
              row.Id = row.Id.replace(/"/g, ''); // strip quotes from row.Id
              return {
                tag: row.Tag in tagConfig ? tagConfig[row.Tag as TagValue].type : undefined,
                itemId: row.Id,
              };
            }
          }),
        ),
      );

      for (const row of contents) {
        if ('Id' in row && 'Hash' in row) {
          row.Tag = row.Tag.toLowerCase();
          row.Id = row.Id.replace(/"/g, ''); // strip quotes from row.Id
          dispatch(
            setItemNote({
              note: row.Notes,
              itemId: row.Id,
            }),
          );
        }
      }

      total += contents.length;
    }

    return total;
  };
}

function capitalizeFirstLetter(str: string) {
  if (!str || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadCsv(filename: string, csv: string) {
  const filenameWithExt = `${filename}.csv`;
  gaEvent('file_download', {
    file_name: filenameWithExt,
    file_extension: 'csv',
  });
  download(csv, filenameWithExt, 'text/csv');
}

function buildSocketNames(item: DimItem): string[] {
  if (!item.sockets) {
    return [];
  }

  const sockets = [];
  const { intrinsicSocket, modSocketsByCategory, perks } = getDisplayedItemSockets(
    item,
    /* excludeEmptySockets */ true,
  )!;

  if (intrinsicSocket) {
    sockets.push(intrinsicSocket);
  }

  if (perks) {
    sockets.push(...getSocketsByIndexes(item.sockets, perks.socketIndexes));
  }
  // Improve this when we use iterator-helpers
  sockets.push(...[...modSocketsByCategory.values()].flat());

  const socketItems = sockets.map(
    (s) =>
      (isKillTrackerSocket(s) && s.plugged?.plugDef.displayProperties.name) ||
      s.plugOptions.map((p) =>
        s.plugged?.plugDef.hash === p.plugDef.hash
          ? `${p.plugDef.displayProperties.name}*`
          : p.plugDef.displayProperties.name,
      ),
  );

  return socketItems.flat();
}

function buildNodeNames(nodes: D1GridNode[]): string[] {
  return filterMap(nodes, (node) => {
    if (D1_FILTERED_NODE_HASHES.includes(node.hash)) {
      return;
    }
    return node.activated ? `${node.name}*` : node.name;
  });
}

function getMaxPerks(items: DimItem[]) {
  // We need to always emit enough columns for all perks
  return (
    _.max(
      items.map(
        (item) =>
          (isD1Item(item) && item.talentGrid
            ? buildNodeNames(item.talentGrid.nodes)
            : item.sockets
              ? buildSocketNames(item)
              : []
          ).length,
      ),
    ) || 0
  );
}

function addPerks(row: Record<string, unknown>, item: DimItem, maxPerks: number) {
  const perks =
    isD1Item(item) && item.talentGrid
      ? buildNodeNames(item.talentGrid.nodes)
      : item.sockets
        ? buildSocketNames(item)
        : [];

  _.times(maxPerks, (index) => {
    row[`Perks ${index}`] = perks[index];
  });
}

function formatLoadouts(item: DimItem, loadouts: LoadoutsByItem) {
  return loadouts[item.id]?.map(({ loadout }) => loadout.name).join(', ') ?? '';
}

function downloadGhost(
  items: DimItem[],
  nameMap: { [key: string]: string },
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  loadouts: LoadoutsByItem,
) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  const data = items.map((item) => {
    const row = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: getTag(item),
      Tier: item.tier,
      Source: source(item),
      Owner: nameMap[item.owner],
      Locked: item.locked,
      Equipped: item.equipped,
      Loadouts: formatLoadouts(item, loadouts),
      Notes: getNotes(item),
    };

    addPerks(row, item, maxPerks);

    return row;
  });

  return data;
}

function equippable(item: DimItem) {
  return item.classType === DestinyClass.Unknown ? 'Any' : item.classTypeNameLocalized;
}

export function source(item: DimItem) {
  if (item.destinyVersion === 2) {
    return (
      sourceKeys.find(
        (src) =>
          (item.source && D2Sources[src].sourceHashes?.includes(item.source)) ||
          D2Sources[src].itemHashes?.includes(item.hash),
      ) || ''
    );
  }
}

function downloadArmor(
  items: DimItem[],
  nameMap: { [key: string]: string },
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  loadouts: LoadoutsByItem,
) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  // In PapaParse, the keys of the first objects are used as columns. So if a
  // key is omitted from the first object, it won't show up.
  // TODO: Replace PapaParse with a simpler/smaller CSV generator
  const data = items.map((item) => {
    const row: Record<string, unknown> = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: getTag(item),
      Tier: item.tier,
      Type: item.typeName,
      Source: source(item),
      Equippable: equippable(item),
      [item.destinyVersion === 1 ? 'Light' : 'Power']: item.power,
    };
    if (item.destinyVersion === 2) {
      row['Energy Capacity'] = item.energy?.energyCapacity || undefined;
    }
    row.Owner = nameMap[item.owner];
    if (item.destinyVersion === 1) {
      row['% Leveled'] = (item.percentComplete * 100).toFixed(0);
    }
    row.Locked = item.locked;
    row.Equipped = item.equipped;
    row.Year = getItemYear(item);
    if (item.destinyVersion === 2) {
      row.Season = getSeason(item);
      const event = getEvent(item);
      row.Event = event ? D2EventInfo[event].name : '';
    }

    if (isD1Item(item)) {
      row['% Quality'] = item.quality?.min ?? 0;
    }
    const stats: { [name: string]: { value: number; pct: number; base: number } } = {};
    if (item.stats) {
      if (isD1Item(item)) {
        for (const stat of item.stats) {
          let pct = 0;
          if (stat.scaled?.min) {
            pct = Math.round((100 * stat.scaled.min) / (stat.split || 1));
          }
          stats[stat.statHash] = {
            value: stat.value,
            pct,
            base: 0,
          };
        }
      } else {
        for (const stat of item.stats) {
          stats[stat.statHash] = {
            value: stat.value,
            base: stat.base,
            pct: 0,
          };
        }
      }
    }
    if (item.destinyVersion === 1) {
      row['% IntQ'] = stats.Intellect?.pct ?? 0;
      row['% DiscQ'] = stats.Discipline?.pct ?? 0;
      row['% StrQ'] = stats.Strength?.pct ?? 0;
      row.Int = stats.Intellect?.value ?? 0;
      row.Disc = stats.Discipline?.value ?? 0;
      row.Str = stats.Strength?.value ?? 0;
    } else {
      const armorStats = Object.keys(dimArmorStatHashByName).map((statName) => ({
        name: statName,
        stat: stats[dimArmorStatHashByName[statName]!],
      }));
      for (const stat of armorStats) {
        row[capitalizeFirstLetter(stat.name)] = stat.stat?.value ?? 0;
      }
      for (const stat of armorStats) {
        row[`${capitalizeFirstLetter(stat.name)} (Base)`] = stat.stat?.base ?? 0;
      }

      if (item.sockets) {
        row['Seasonal Mod'] = getSpecialtySocketMetadatas(item)?.map((m) => m.slotTag) ?? '';
      }
    }

    row.Loadouts = formatLoadouts(item, loadouts);
    row.Notes = getNotes(item);

    addPerks(row, item, maxPerks);

    return row;
  });
  return data;
}

function downloadWeapons(
  items: DimItem[],
  nameMap: { [key: string]: string },
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  loadouts: LoadoutsByItem,
) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  // In PapaParse, the keys of the first objects are used as columns. So if a
  // key is omitted from the first object, it won't show up.
  // TODO: Replace PapaParse with a simpler/smaller CSV generator
  const data = items.map((item) => {
    const row: Record<string, unknown> = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: getTag(item),
      Tier: item.tier,
      Type: item.typeName,
      Source: source(item),
      Category: item.type,
      Element: item.element?.displayProperties.name,
      [item.destinyVersion === 1 ? 'Light' : 'Power']: item.power,
    };
    if (item.destinyVersion === 2) {
      row['Masterwork Type'] = getMasterworkStatNames(item.masterworkInfo) || undefined;
      row['Masterwork Tier'] = item.masterworkInfo?.tier || undefined;
    }
    row.Owner = nameMap[item.owner];
    if (item.destinyVersion === 1) {
      row['% Leveled'] = (item.percentComplete * 100).toFixed(0);
    }
    row.Locked = item.locked;
    row.Equipped = item.equipped;
    row.Year = getItemYear(item);
    if (item.destinyVersion === 2) {
      row.Season = getSeason(item);
      const event = getEvent(item);
      row.Event = event ? D2EventInfo[event].name : '';
    }

    const stats = {
      aa: 0,
      impact: 0,
      range: 0,
      zoom: 0,
      stability: 0,
      rof: 0,
      reload: 0,
      magazine: 0,
      equipSpeed: 0,
      drawtime: 0,
      chargetime: 0,
      accuracy: 0,
      recoil: 0,
      blastRadius: 0,
      velocity: 0,
      airborne: 0,
      shieldduration: 0,
      chargerate: 0,
      guardresist: 0,
      guardefficiency: 0,
      guardendurance: 0,
      swingspeed: 0,
    };

    if (item.stats) {
      for (const stat of item.stats) {
        if (stat.value) {
          switch (stat.statHash) {
            case StatHashes.RecoilDirection:
              stats.recoil = stat.value;
              break;
            case StatHashes.AimAssistance:
              stats.aa = stat.value;
              break;
            case StatHashes.Impact:
              stats.impact = stat.value;
              break;
            case StatHashes.Range:
              stats.range = stat.value;
              break;
            case StatHashes.Zoom:
              stats.zoom = stat.value;
              break;
            case StatHashes.Stability:
              stats.stability = stat.value;
              break;
            case StatHashes.RoundsPerMinute:
              stats.rof = stat.value;
              break;
            case StatHashes.ReloadSpeed:
              stats.reload = stat.value;
              break;
            case StatHashes.Magazine:
            case StatHashes.AmmoCapacity:
              stats.magazine = stat.value;
              break;
            case StatHashes.Handling:
              stats.equipSpeed = stat.value;
              break;
            case StatHashes.DrawTime:
              stats.drawtime = stat.value;
              break;
            case StatHashes.ChargeTime:
              stats.chargetime = stat.value;
              break;
            case StatHashes.Accuracy:
              stats.accuracy = stat.value;
              break;
            case StatHashes.BlastRadius:
              stats.blastRadius = stat.value;
              break;
            case StatHashes.Velocity:
              stats.velocity = stat.value;
              break;
            case StatHashes.AirborneEffectiveness:
              stats.airborne = stat.value;
              break;
            case StatHashes.ShieldDuration:
              stats.shieldduration = stat.value;
              break;
            case StatHashes.ChargeRate:
              stats.chargerate = stat.value;
              break;
            case StatHashes.GuardResistance:
              stats.guardresist = stat.value;
              break;
            case StatHashes.GuardEfficiency:
              stats.guardefficiency = stat.value;
              break;
            case StatHashes.GuardEndurance:
              stats.guardendurance = stat.value;
              break;
            case StatHashes.SwingSpeed:
              stats.swingspeed = stat.value;
              break;
          }
        }
      }
    }

    row.Recoil = stats.recoil;
    row.AA = stats.aa;
    row.Impact = stats.impact;
    row.Range = stats.range;
    row.Zoom = stats.zoom;
    row['Blast Radius'] = stats.blastRadius;
    row.Velocity = stats.velocity;
    row.Stability = stats.stability;
    row.ROF = stats.rof;
    row.Reload = stats.reload;
    row.Mag = stats.magazine;
    if (item.destinyVersion === 2) {
      row.Handling = stats.equipSpeed;
    } else {
      row.Equip = stats.equipSpeed;
    }
    row['Charge Time'] = stats.chargetime;
    if (item.destinyVersion === 2) {
      row['Draw Time'] = stats.drawtime;
      row.Accuracy = stats.accuracy;

      // Sword Stats
      row['Charge Rate'] = stats.chargerate;
      row['Guard Resistance'] = stats.guardresist;
      row['Guard Efficiency'] = stats.guardefficiency;
      row['Guard Endurance'] = stats.guardendurance;
      row['Swing Speed'] = stats.swingspeed;

      row['Shield Duration'] = stats.shieldduration; // Glaive
      row['Airborne Effectiveness'] = stats.airborne;

      row.Crafted = item.crafted;
      row['Crafted Level'] = item.craftedInfo?.level ?? 0;

      row['Kill Tracker'] = getItemKillTrackerInfo(item)?.count ?? 0;
      row.Foundry = item.foundry;
    }

    row.Loadouts = formatLoadouts(item, loadouts);
    row.Notes = getNotes(item);

    addPerks(row, item, maxPerks);

    return row;
  });

  return data;
}
