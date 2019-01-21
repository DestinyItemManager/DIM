import * as _ from 'lodash';
import { DimItem, DimSockets, DimGridNode } from './item-types';
import { t } from 'i18next';
import * as Papa from 'papaparse';
import { getActivePlatform } from '../accounts/platform.service';
import { getItemInfoSource, TagValue } from './dim-item-info';
import { D2SeasonInfo } from './d2-season-info';
import { D2EventInfo } from './d2-event-info';
import { DimStore } from './store-types';

// step node names we'll hide, we'll leave "* Chroma" for now though, since we don't otherwise indicate Chroma
const FILTER_NODE_NAMES = [
  'Upgrade Defense',
  'Ascend',
  'Infuse',
  'Increase Intellect',
  'Increase Discipline',
  'Increase Strength',
  'Twist Fate',
  'The Life Exotic',
  'Reforge Artifact',
  'Reforge Shell',
  'Deactivate Chroma',
  'Kinetic Damage',
  'Solar Damage',
  'Arc Damage',
  'Void Damage',
  'Default Shader',
  'Default Ornament',
  'Empty Mod Socket',
  'No Projection'
];

function capitalizeFirstLetter(str: string) {
  if (!str || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadCsv(filename: string, csv: string) {
  filename = `${filename}.csv`;
  const pom = document.createElement('a');
  pom.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
  pom.setAttribute('download', filename);
  document.body.appendChild(pom);
  pom.click();
  document.body.removeChild(pom);
}

function buildSocketNames(sockets: DimSockets): string[] {
  const socketItems = sockets.sockets.map((s) =>
    s.plugOptions
      .filter((p) => !FILTER_NODE_NAMES.some((n) => n === p.plugItem.displayProperties.name))
      .map((p) =>
        s.plug && s.plug.plugItem.hash && p.plugItem.hash === s.plug.plugItem.hash
          ? `${p.plugItem.displayProperties.name}*`
          : p.plugItem.displayProperties.name
      )
  );

  return _.flatten(socketItems);
}

function buildNodeNames(nodes: DimGridNode[]): string[] {
  return _.compact(
    nodes.map((node) => {
      if (FILTER_NODE_NAMES.includes(node.name)) {
        return;
      }
      return node.activated ? `${node.name}*` : node.name;
    })
  );
}

function getMaxPerks(items: DimItem[]) {
  // We need to always emit enough columns for all perks
  return (
    _.max(
      items.map(
        (item) =>
          (item.talentGrid
            ? buildNodeNames(item.talentGrid.nodes)
            : item.isDestiny2() && item.sockets
            ? buildSocketNames(item.sockets)
            : []
          ).length
      )
    ) || 0
  );
}

function addPerks(row: object, item: DimItem, maxPerks: number) {
  const perks = item.talentGrid
    ? buildNodeNames(item.talentGrid.nodes)
    : item.isDestiny2() && item.sockets
    ? buildSocketNames(item.sockets)
    : [];

  _.times(maxPerks, (index) => {
    row[`Perks ${index}`] = perks[index];
  });
}

function downloadGhost(items: DimItem[], nameMap: { [key: string]: string }) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  const data = items.map((item) => {
    const row: any = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: item.dimInfo.tag,
      Tier: item.tier,
      Owner: nameMap[item.owner],
      Locked: item.locked,
      Equipped: item.equipped,
      Notes: item.dimInfo.notes
    };

    addPerks(row, item, maxPerks);

    return row;
  });

  downloadCsv('destinyGhosts', Papa.unparse(data));
}

function equippable(item: DimItem) {
  let equippable = item.classTypeName;
  if (!equippable || equippable === 'unknown') {
    equippable =
      !equippable || equippable === 'unknown' ? 'Any' : capitalizeFirstLetter(equippable);
  }
  return equippable;
}

function downloadArmor(items: DimItem[], nameMap: { [key: string]: string }) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  const data = items.map((item) => {
    const row: any = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: item.dimInfo.tag,
      Tier: item.tier,
      Type: item.typeName,
      Equippable: equippable(item),
      [item.isDestiny1() ? 'Light' : 'Power']: item.primStat && item.primStat.value
    };
    if (item.isDestiny2()) {
      row['Masterwork Type'] = item.masterworkInfo && item.masterworkInfo.statName;
      row['Masterwork Tier'] =
        item.masterworkInfo && item.masterworkInfo.statValue
          ? item.masterworkInfo.statValue <= 5
            ? item.masterworkInfo.statValue
            : 5
          : undefined;
    }
    row.Owner = nameMap[item.owner];
    if (item.isDestiny1()) {
      row['% Leveled'] = (item.percentComplete * 100).toFixed(0);
    }
    row.Locked = item.locked;
    row.Equipped = item.equipped;
    if (item.isDestiny1()) {
      row.Year = item.year;
    } else if (item.isDestiny2()) {
      row.Year = D2SeasonInfo[item.season].year;
    }
    if (item.isDestiny2()) {
      row.Season = item.season;
      row.Event = item.event ? D2EventInfo[item.event].name : '';
    }
    if (item.dtrRating && item.dtrRating.overallScore) {
      row['DTR Rating'] = item.dtrRating.overallScore;
      row['# of Reviews'] = item.dtrRating.ratingCount;
    } else {
      row['DTR Rating'] = 'N/A';
      row['# of Reviews'] = 'N/A';
    }
    if (item.isDestiny1()) {
      row['% Quality'] = item.quality ? item.quality.min : 0;
    }
    const stats: { [name: string]: { value: number; pct: number } } = {};
    if (item.isDestiny1() && item.stats) {
      item.stats.forEach((stat) => {
        let pct = 0;
        if (stat.scaled && stat.scaled.min) {
          pct = Math.round((100 * stat.scaled.min) / (stat.split || 1));
        }
        stats[stat.name] = {
          value: stat.value || 0,
          pct
        };
      });
    } else if (item.isDestiny2() && item.stats) {
      item.stats.forEach((stat) => {
        stats[stat.name] = {
          value: stat.value || 0,
          pct: 0
        };
      });
    }
    if (item.isDestiny1()) {
      row['% IntQ'] = stats.Intellect ? stats.Intellect.pct : 0;
      row['% DiscQ'] = stats.Discipline ? stats.Discipline.pct : 0;
      row['% StrQ'] = stats.Strength ? stats.Strength.pct : 0;
      row.Int = stats.Intellect ? stats.Intellect.value : 0;
      row.Disc = stats.Discipline ? stats.Discipline.value : 0;
      row.Str = stats.Strength ? stats.Strength.value : 0;
    } else {
      row.Mobility = stats.Intellect ? stats.Intellect.value : 0;
      row.Recovery = stats.Recovery ? stats.Recovery.value : 0;
      row.Resilience = stats.Resilience ? stats.Resilience.value : 0;
    }

    row.Notes = item.dimInfo.notes;

    addPerks(row, item, maxPerks);

    return row;
  });
  downloadCsv('destinyArmor', Papa.unparse(data));
}

function downloadWeapons(items: DimItem[], nameMap: { [key: string]: string }) {
  // We need to always emit enough columns for all perks
  const maxPerks = getMaxPerks(items);

  const data = items.map((item) => {
    const row: any = {
      Name: item.name,
      Hash: item.hash,
      Id: `"${item.id}"`,
      Tag: item.dimInfo.tag,
      Tier: item.tier,
      Type: item.typeName,
      [item.isDestiny1() ? 'Light' : 'Power']: item.primStat && item.primStat.value,
      Dmg: item.dmg ? `${capitalizeFirstLetter(item.dmg)}` : 'Kinetic'
    };
    if (item.isDestiny2()) {
      row['Masterwork Type'] = item.masterworkInfo && item.masterworkInfo.statName;
      row['Masterwork Tier'] =
        item.masterworkInfo && item.masterworkInfo.statValue
          ? item.masterworkInfo.statValue <= 10
            ? item.masterworkInfo.statValue
            : 10
          : undefined;
    }
    row.Owner = nameMap[item.owner];
    if (item.isDestiny1()) {
      row['% Leveled'] = (item.percentComplete * 100).toFixed(0);
    }
    row.Locked = item.locked;
    row.Equipped = item.equipped;
    if (item.isDestiny1()) {
      row.Year = item.year;
    } else if (item.isDestiny2()) {
      row.Year = D2SeasonInfo[item.season].year;
    }
    if (item.isDestiny2()) {
      row.Season = item.season;
      row.Event = item.event ? D2EventInfo[item.event].name : '';
    }
    if (item.dtrRating && item.dtrRating.overallScore) {
      row['DTR Rating'] = item.dtrRating.overallScore;
      row['# of Reviews'] = item.dtrRating.ratingCount;
    } else {
      row['DTR Rating'] = 'N/A';
      row['# of Reviews'] = 'N/A';
    }

    const stats = {
      aa: 0,
      impact: 0,
      range: 0,
      stability: 0,
      rof: 0,
      reload: 0,
      magazine: 0,
      equipSpeed: 0,
      drawtime: 0,
      chargetime: 0,
      accuracy: 0
    };

    if (item.stats) {
      item.stats.forEach((stat) => {
        if (stat.value) {
          switch (stat.statHash) {
            case 1345609583: // Aim Assist
              stats.aa = stat.value;
              break;
            case 4043523819: // Impact
              stats.impact = stat.value;
              break;
            case 1240592695: // Range
              stats.range = stat.value;
              break;
            case 155624089: // Stability
              stats.stability = stat.value;
              break;
            case 4284893193: // Rate of fire
              stats.rof = stat.value;
              break;
            case 4188031367: // Reload
              stats.reload = stat.value;
              break;
            case 3871231066: // Magazine
            case 925767036: // Energy
              stats.magazine = stat.value;
              break;
            case 943549884: // Equip Speed
              stats.equipSpeed = stat.value;
              break;
            case 447667954: // Draw Time
              stats.drawtime = stat.value;
              break;
            case 2961396640: // Charge Time
              stats.chargetime = stat.value;
              break;
            case 1591432999: // accuracy
              stats.accuracy = stat.value;
              break;
          }
        }
      });
    }

    row.AA = stats.aa;
    row.Impact = stats.impact;
    row.Range = stats.range;
    row.Stability = stats.stability;
    row.ROF = stats.rof;
    row.Reload = stats.reload;
    row.Mag = stats.magazine;
    row.Equip = stats.equipSpeed;
    row['Charge Time'] = stats.chargetime;
    if (item.isDestiny2()) {
      row['Draw Time'] = stats.drawtime;
      row.Accuracy = stats.accuracy;
    }
    row.Notes = item.dimInfo.notes;

    addPerks(row, item, maxPerks);

    return row;
  });
  downloadCsv('destinyWeapons', Papa.unparse(data));
}

export function downloadCsvFiles(stores: DimStore[], type: 'Weapons' | 'Armor' | 'Ghost') {
  // perhaps we're loading
  if (stores.length === 0) {
    alert(t('Settings.ExportSSNoStores'));
    return;
  }
  const nameMap = {};
  let allItems: DimItem[] = [];
  stores.forEach((store) => {
    allItems = allItems.concat(store.items);
    nameMap[store.id] =
      store.id === 'vault' ? 'Vault' : `${capitalizeFirstLetter(store.class)}(${store.powerLevel})`;
  });
  const items: DimItem[] = [];
  allItems.forEach((item) => {
    if (!item.primStat && type !== 'Ghost') {
      return;
    }

    if (type === 'Weapons') {
      if (
        item.primStat &&
        (item.primStat.statHash === 368428387 || item.primStat.statHash === 1480404414)
      ) {
        items.push(item);
      }
    } else if (type === 'Armor') {
      if (item.primStat && item.primStat.statHash === 3897883278) {
        items.push(item);
      }
    } else if (type === 'Ghost' && item.bucket.hash === 4023194814) {
      items.push(item);
    }
  });
  switch (type) {
    case 'Weapons':
      downloadWeapons(items, nameMap);
      break;
    case 'Armor':
      downloadArmor(items, nameMap);
      break;
    case 'Ghost':
      downloadGhost(items, nameMap);
      break;
  }
}

interface CSVRow {
  Notes: string;
  Tag: string;
  Hash: string;
  Id: string;
}

export async function importTagsNotesFromCsv(files: File[]) {
  const account = getActivePlatform();
  if (!account) {
    return;
  }

  let total = 0;

  const itemInfoService = await getItemInfoSource(account);
  for (const file of files) {
    const results = await new Promise<Papa.ParseResult>((resolve, reject) =>
      Papa.parse(file, {
        header: true,
        complete: resolve,
        error: reject
      })
    );
    if (
      results.errors &&
      results.errors.length &&
      !results.errors.every((e) => e.code === 'TooManyFields' || e.code === 'TooFewFields')
    ) {
      throw new Error(results.errors[0].message);
    }
    const contents: CSVRow[] = results.data;

    if (!contents || !contents.length) {
      throw new Error(t('Csv.EmptyFile'));
    }

    const row = contents[0];
    if (!('Id' in row) || !('Hash' in row) || !('Tag' in row) || !('Notes' in row)) {
      throw new Error(t('Csv.WrongFields'));
    }

    await itemInfoService.bulkSaveByKeys(
      _.compact(
        contents.map((row) => {
          if ('Id' in row && 'Hash' in row) {
            row.Id = row.Id.replace(/"/g, ''); // strip quotes from row.Id
            return {
              tag: ['favorite', 'keep', 'infuse', 'junk'].includes(row.Tag)
                ? (row.Tag as TagValue)
                : undefined,
              notes: row.Notes,
              key: `${row.Hash}-${row.Id}`
            };
          }
        })
      )
    );

    total += contents.length;
  }

  return total;
}
