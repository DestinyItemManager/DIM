import { languageSelector } from 'app/dim-api/selectors';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { getSocketsWithStyle, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import destinysets from 'images/destinysets.svg';
import logo from 'images/dimlogo.svg';
import foundry from 'images/foundry.png';
import ishtarLogo from 'images/ishtar-collective.svg';
import lightgg from 'images/lightgg.png';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import styles from './Links.m.scss';

export default function Links({ item }: { item: DimItem }) {
  const language = useSelector(languageSelector);
  const isPhonePortrait = useIsPhonePortrait();

  const links = [
    {
      name: 'DIM',
      icon: logo,
      link: `/armory/${item.hash}?perks=${buildSocketParam(item)}`,
    },
    {
      name: 'Light.gg',
      icon: lightgg,
      link: `https://www.light.gg/db/${language}/items/${item.hash}${buildLightGGSockets(item)}`,
    },
    item.bucket.inWeapons && {
      name: 'D2Foundry',
      icon: foundry,
      link: `https://d2foundry.gg/w/${item.hash}${buildFoundrySockets(item)}`,
    },
    !isPhonePortrait && {
      name: 'data.destinysets.com',
      icon: destinysets,
      link: `https://data.destinysets.com/i/InventoryItem:${item.hash}?lang=${language}`,
    },
    item.loreHash && {
      name: t('MovePopup.ReadLoreLink'),
      icon: ishtarLogo,
      link: `http://www.ishtar-collective.net/entries/${item.loreHash}`,
    },
  ];

  return (
    <ul className={styles.links}>
      {_.compact(links).map(({ link, name, icon }) => (
        <li key={name}>
          <ExternalLink href={link}>
            <img src={icon} height={16} width={16} />
            {name}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
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
  item: DimItem,
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
      s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsOriginTraits),
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
      s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage),
    );
    const weaponMod = weaponModSocket?.plugged!.plugDef.hash ?? 0;

    return { traits, originTrait, masterwork, weaponMod };
  }

  return null;
}
