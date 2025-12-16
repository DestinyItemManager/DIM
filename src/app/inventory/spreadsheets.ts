import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { currentAccountSelector } from 'app/accounts/selectors';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { maxLength } from 'app/item-popup/NotesArea';
import { LoadoutsByItem, loadoutsByItemSelector } from 'app/loadout/selectors';
import { buildStatInfo, getColumns } from 'app/organizer/Columns';
import { SpreadsheetContext } from 'app/organizer/table-types';
import { D1_StatHashes } from 'app/search/d1-known-values';
import { TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { ThunkResult } from 'app/store/types';
import { filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { CsvRow, downloadCsv } from 'app/utils/csv';
import { DimError } from 'app/utils/dim-error';
import { localizedSorter } from 'app/utils/intl';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getDisplayedItemSockets, getSocketsByIndexes } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import Papa from 'papaparse';
import { setItemNote, setItemTagsBulk } from './actions';
import { TagValue, tagConfig } from './dim-item-info';
import { D1GridNode, DimItem } from './item-types';
import { getNotesSelector, getTagSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';

function getClass(type: DestinyClass) {
  switch (type) {
    case DestinyClass.Titan:
      return 'Titan';
    case DestinyClass.Hunter:
      return 'Hunter';
    case DestinyClass.Warlock:
      return 'Warlock';
    case DestinyClass.Unknown:
      return 'Unknown';
    case DestinyClass.Classified:
      return 'Classified';
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

/** Stat names are not localized in CSV. We use a map to preserve order. */
export const csvStatNamesForDestinyVersion = (destinyVersion: DestinyVersion) =>
  new Map<StatHashes | typeof TOTAL_STAT_HASH, string>([
    [StatHashes.RecoilDirection, 'Recoil'],
    [StatHashes.AimAssistance, 'AA'],
    [StatHashes.Impact, 'Impact'],
    [StatHashes.Range, 'Range'],
    [StatHashes.Zoom, 'Zoom'],
    [StatHashes.BlastRadius, 'Blast Radius'],
    [StatHashes.Velocity, 'Velocity'],
    [StatHashes.Persistence, 'Persistence'],
    [StatHashes.Stability, 'Stability'],
    [StatHashes.RoundsPerMinute, 'ROF'],
    [StatHashes.ReloadSpeed, 'Reload'],
    [StatHashes.AmmoCapacity, 'Mag'],
    [StatHashes.Magazine, 'Mag'],
    [StatHashes.Handling, destinyVersion === 2 ? 'Handling' : 'Equip'],
    [StatHashes.ChargeTime, 'Charge Time'],
    [StatHashes.DrawTime, 'Draw Time'],
    [StatHashes.Accuracy, 'Accuracy'],
    [StatHashes.ChargeRate, 'Charge Rate'],
    [StatHashes.GuardResistance, 'Guard Resistance'],
    [StatHashes.GuardEndurance, 'Guard Endurance'],
    [StatHashes.SwingSpeed, 'Swing Speed'],
    [StatHashes.ShieldDuration, 'Shield Duration'],
    [StatHashes.AirborneEffectiveness, 'Airborne Effectiveness'],
    [StatHashes.AmmoGeneration, 'Ammo Generation'],
    [StatHashes.HeatGenerated, 'Heat Generated'],
    [StatHashes.CoolingEfficiency, 'Cooling Efficiency'],
    [StatHashes.Weapons, destinyVersion === 2 ? 'Weapons' : 'Mobility'],
    [StatHashes.Health, destinyVersion === 2 ? 'Health' : 'Resilience'],
    [StatHashes.Class, destinyVersion === 2 ? 'Class' : 'Recovery'],
    [StatHashes.Grenade, destinyVersion === 2 ? 'Grenade' : 'Disc'],
    [StatHashes.Super, destinyVersion === 2 ? 'Super' : 'Int'],
    [StatHashes.Melee, destinyVersion === 2 ? 'Melee' : 'Str'],
    [TOTAL_STAT_HASH, 'Total'],
  ]);

export function generateCSVExportData(
  type: 'weapon' | 'armor' | 'ghost',
  stores: DimStore[],
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  loadoutsByItem: LoadoutsByItem,
  customStats: CustomStatDef[],
) {
  const storeNamesById: { [storeId: string]: string } = {};
  let allItems: DimItem[] = [];
  for (const store of stores) {
    allItems = allItems.concat(store.items);
    storeNamesById[store.id] =
      store.id === 'vault' ? 'Vault' : `${getClass(store.classType)}(${store.powerLevel})`;
  }
  allItems.sort(compareBy((item) => item.index));
  let items: DimItem[] = [];
  if (type === 'weapon') {
    items = allItems.filter(
      (item) =>
        // Checking the primary stat filters out some quest items
        item.primaryStat &&
        (item.primaryStat?.statHash === D1_StatHashes.Attack ||
          item.primaryStat?.statHash === StatHashes.Attack),
    );
  } else if (type === 'armor') {
    items = allItems.filter(
      // Checking the primary stat filters out festival masks
      (item) => item.primaryStat && item.primaryStat?.statHash === StatHashes.Defense,
    );
  } else if (type === 'ghost') {
    items = allItems.filter((item) => item.bucket.hash === BucketHashes.Ghost);
  }

  const statHashes = buildStatInfo(items);
  const destinyVersion = items[0]?.destinyVersion ?? 2;

  // Use the column definitions from Organizer to drive the CSV output
  const columns = getColumns(
    'spreadsheet',
    type,
    statHashes,
    getTag,
    getNotes,
    () => undefined /* wishList */,
    false /* hasWishList */,
    customStats,
    loadoutsByItem,
    new Set<string>() /* newItems */,
    destinyVersion /* destinyVersion */,
  );

  // The order of the spreadsheet columns differs from the Organizer order.
  // PapaParse determines column order from the insertion order of data into the
  // first object that's returned, so we need to iterate the columns in this
  // order.
  const statNames = csvStatNamesForDestinyVersion(destinyVersion);
  const order = [
    'name',
    'hash',
    'id',
    'tag',
    'tier', // rarity
    'itemTier',
    'Type',
    'source',
    'Equippable',
    'Category',
    'dmg',
    'ammo',
    'power',
    'energy',
    'archetype',
    'tertiary',
    'tuning',
    'masterworkStat',
    'masterworkTier',
    'location',
    'locked',
    'Equipped',
    'featured',
    'holofoil',
    'year',
    'season',
    'event',
    ...[...statNames.keys()].map((statHash) => `stat${statHash}`),
    ...[...statNames.keys()].map((statHash) => `base${statHash}`),
    'crafted',
    'level',
    'killTracker',
    'foundry',
    'modslot',
    'loadouts',
    'notes',

    // then perks
  ];
  columns.sort(
    compareBy((c) => {
      if (c.id === 'perks') {
        // perks are always last
        return 2000;
      }
      const index = order.indexOf(c.id);
      if (index < 0) {
        // A new column was added and we need to add it to the order above
        throw new Error(`missing-column-order ${c.id}`);
      }
      return index;
    }),
  );

  const context: SpreadsheetContext = { storeNamesById };
  const data = items.map((item) => {
    const row: CsvRow = {};
    for (const column of columns) {
      const value = column.value(item);
      if (typeof column.csv === 'string') {
        row[column.csv] ||= value;
      } else if (column.csv) {
        const values = column.csv(value, item, context);
        if (!values) {
          continue;
        }
        const [key, csvValue] = values;
        row[key] ||= csvValue;
      } else {
        // Column has no CSV representation - either remove the column in spreadsheet mode or add a 'csv' or 'csvVal' property
        throw new Error(`missing-csv: ${column.id}`);
      }
    }
    return row;
  });

  return data;
}

export function downloadCsvFiles(type: 'weapon' | 'armor' | 'ghost'): ThunkResult {
  return async (_dispatch, getState) => {
    const stores = storesSelector(getState());
    const getTag = getTagSelector(getState());
    const getNotes = getNotesSelector(getState());
    const loadoutsForItem = loadoutsByItemSelector(getState());
    const customStats = customStatsSelector(getState());
    const language = languageSelector(getState());

    // perhaps we're loading
    if (stores.length === 0) {
      return;
    }
    const data = generateCSVExportData(
      type,
      stores,
      getTag,
      getNotes,
      loadoutsForItem,
      customStats,
    );
    data.sort(localizedSorter(language, (r) => (r as { Name: string }).Name));
    downloadCsv(`destiny-${type}`, data, {
      unpackArrays: ['Perks'],
    });
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
              note: row.Notes.substring(0, maxLength),
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

export function buildSocketNames(item: DimItem): string[] {
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

export function buildNodeNames(nodes: D1GridNode[]): string[] {
  return filterMap(nodes, (node) => {
    if (D1_FILTERED_NODE_HASHES.includes(node.hash)) {
      return;
    }
    return node.activated ? `${node.name}*` : node.name;
  });
}
