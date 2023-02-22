import { languageSelector } from 'app/dim-api/selectors';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { DimItem } from 'app/inventory/item-types';
import { LoreLink } from 'app/item-popup/ItemDescription';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { getSocketsWithStyle, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import destinysets from 'images/destinysets.svg';
import destinytracker from 'images/destinytracker.png';
import logo from 'images/dimlogo.svg';
import foundry from 'images/foundry.png';
import lightgg from 'images/lightgg.png';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import styles from './Links.m.scss';

// TODO: permalink for sharing
const links = [
  {
    name: 'DIM',
    icon: logo,
    link: (item: DimItem) => `/armory/${item.hash}?perks=${buildSocketParam(item)}`,
  },
  {
    name: 'Light.gg',
    icon: lightgg,
    link: (item: DimItem, language: string) =>
      `https://www.light.gg/db/${language}/items/${item.hash}${buildLightGGSockets(item)}`,
  },
  { name: 'DestinyTracker', icon: destinytracker, link: destinyDBLink },
  {
    name: 'Foundry',
    icon: foundry,
    link: (item: DimItem) => `https://d2foundry.gg/w/${item.hash}${buildFoundrySockets(item)}`,
  },
  {
    name: 'data.destinysets.com',
    icon: destinysets,
    link: (item: DimItem, language: string) =>
      `https://data.destinysets.com/i/InventoryItem:${item.hash}?lang=${language}`,
    hideOnPhone: true,
  },
];

export default function Links({ item }: { item: DimItem }) {
  const language = useSelector(languageSelector);
  const isPhonePortrait = useIsPhonePortrait();
  return (
    <ul className={styles.links}>
      {links
        .filter((l) => l.name !== 'Gunsmith' || item.bucket.inWeapons)
        .map(
          ({ link, name, icon, hideOnPhone }) =>
            !(isPhonePortrait && hideOnPhone) && (
              <li key={name}>
                <ExternalLink href={link(item, language)}>
                  <img src={icon} height={16} width={16} />
                  {name}
                </ExternalLink>
              </li>
            )
        )}
      {item.loreHash !== undefined && (
        <li>
          <LoreLink loreHash={item.loreHash} />
        </li>
      )}
    </ul>
  );
}

function destinyDBLink(item: DimItem) {
  const DimItem = item;
  let perkQueryString = '';

  if (DimItem) {
    const perkCsv = buildSocketParam(DimItem);
    // to-do: if buildPerksCsv typing is correct, and can only return a string, lines 142-150 could be a single line
    if (perkCsv?.length) {
      perkQueryString = `?perks=${perkCsv}`;
    }
  }

  return `https://destinytracker.com/destiny-2/db/items/${item.hash}${perkQueryString}`;
}

/**
 * Build a comma-separated list of perks where each entry in the list corresponds to a socket ID and the value is the plugged item hash. A zero corresponds to "no choice".
 */
function buildSocketParam(item: DimItem): string {
  const perkValues: number[] = [];

  if (item.sockets) {
    for (const socket of item.sockets.allSockets) {
      perkValues[socket.socketIndex] = socket.plugged?.plugDef.hash ?? 0;
    }
  }

  // Fill in those empty array elements
  for (let i = 0; i < perkValues.length; i++) {
    perkValues[i] ||= 0;
  }

  return perkValues.join(',');
}

/**
 * Light.gg's socket format is highly similar to that of D2Gunsmith: [...<first four perks, padded out if necessary, origin trait, masterwork, weapon mod].join(',')
 */
function buildLightGGSockets(item: DimItem) {
  const perkValues = getWeaponSocketInfo(item);

  if (perkValues) {
    return perkValues.originTrait
      ? `?p=${perkValues.traits.join(',')},${perkValues.originTrait},${perkValues.masterwork},${
          perkValues.weaponMod
        }`
      : `?p=${perkValues.traits.join(',')},${perkValues.masterwork},${perkValues.weaponMod}`;
  }

  return '';
}

/**
 * Foundry's socket format is: ?p=perkHashes,...&mw=masterworkStatHash&mw_l=masterworkLevel&m=weaponMod
 */
function buildFoundrySockets(item: DimItem) {
  const perkValues = getWeaponSocketInfo(item);

  if (perkValues) {
    const primaryMasterworkStat =
      item.sockets?.allSockets.find(isWeaponMasterworkSocket)?.plugged?.plugDef
        .investmentStats?.[0];
    const mwStatHash = primaryMasterworkStat?.statTypeHash;
    const mwVal = primaryMasterworkStat?.value;
    return `?p=${perkValues.traits.join(',')},${
      perkValues.originTrait
    }&mw=${mwStatHash}&mw_l=${mwVal}&m=${perkValues.weaponMod}`;
  }

  return '';
}

/**
 * Gathers general socket information for link generation in D2Gunsmith and Light.gg.
 */
function getWeaponSocketInfo(
  item: DimItem
): null | { traits: number[]; originTrait: number; masterwork: number; weaponMod: number } {
  if (item.sockets && item.bucket?.inWeapons) {
    const traits: number[] = [0, 0, 0, 0];
    const perks = getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.Reusable);
    perks.unshift(); // remove the archetype perk
    let i = 0;
    // First 4 perks are on all weapons
    for (const perk of _.take(perks, 4)) {
      traits[i] = perk.plugged?.plugDef.hash ?? 0;
      i++;
    }

    const origin = item.sockets.allSockets.find((s) =>
      s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsOriginTraits)
    );
    const originTrait = origin?.plugged!.plugDef.hash ?? 0;

    // TODO: Map enhanced intrinsic frames with their corresponding stat masterworks
    const masterworkSocket = item.sockets.allSockets.find(isWeaponMasterworkSocket);
    const masterwork =
      masterworkSocket?.plugged?.plugDef.plug.plugCategoryHash ===
      PlugCategoryHashes.CraftingPlugsFrameIdentifiers
        ? 0
        : masterworkSocket?.plugged?.plugDef.hash ?? 0;

    const weaponModSocket = item.sockets.allSockets.find((s) =>
      s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage)
    );
    const weaponMod = weaponModSocket?.plugged!.plugDef.hash ?? 0;

    return { traits, originTrait, masterwork, weaponMod };
  }

  return null;
}
