import { languageSelector } from 'app/dim-api/selectors';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { compact } from 'app/utils/collections';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsWithStyle, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import destinysets from 'images/destinysets.svg';
import logo from 'images/dimlogo.svg';
import foundry from 'images/foundry.png';
import ishtarLogo from 'images/ishtar-collective.svg';
import lightgg from 'images/lightgg.png';
import { useSelector } from 'react-redux';
import * as styles from './Links.m.scss';

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
      {compact(links).map(({ link, name, icon }) => (
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
 * Light.gg's socket format is highly similar to that of D2Gunsmith: [...base perks, masterwork, weapon mod].join(',')
 */
function buildLightGGSockets(item: DimItem) {
  const perkValues = getWeaponSocketInfo(item);

  if (perkValues) {
    return `?p=${[...perkValues.largePerks, ...perkValues.traits, perkValues.masterwork, perkValues.weaponMod].map((s) => String(s)).join(',')}`;
  }

  return '';
}

/**
 * Foundry's socket format is: ?p=perkHashes,...&m=weaponMod&mw=masterworkStatHash
 */
function buildFoundrySockets(item: DimItem) {
  const perkValues = getWeaponSocketInfo(item);

  if (perkValues) {
    const primaryMasterworkStat =
      item.sockets?.allSockets.find(isWeaponMasterworkSocket)?.plugged?.plugDef
        .investmentStats?.[0];
    const mwHash = primaryMasterworkStat?.statTypeHash || perkValues.largePerks[0] || 0; // `mw` for crafted exo intrinsic
    const modHash = perkValues.weaponMod || perkValues.masterwork || 0; // `m` for non-crafted exo mw
    return `?p=${perkValues.traits.join(',')}&m=${modHash || ''}&mw=${mwHash || ''}`;
  }

  return '';
}

/**
 * Gathers general socket information for link generation in D2Gunsmith and Light.gg.
 */
function getWeaponSocketInfo(item: DimItem): null | {
  traits: number[];
  masterwork: number;
  weaponMod: number;
  largePerks: number[];
} {
  if (item.sockets && item.bucket?.inWeapons) {
    // TODO: Map enhanced intrinsic frames with their corresponding stat masterworks
    const masterworkSocket = item.sockets.allSockets.find(
      (s) => isWeaponMasterworkSocket(s) && !s.isReusable,
    );
    const masterwork =
      masterworkSocket?.plugged?.plugDef.plug.plugCategoryHash ===
      PlugCategoryHashes.CraftingPlugsFrameIdentifiers
        ? 0
        : (masterworkSocket?.plugged?.plugDef.hash ?? 0);

    const weaponModSocket = item.sockets.allSockets.find((s) =>
      s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage),
    );
    const weaponMod = weaponModSocket?.plugged!.plugDef.hash ?? 0;

    const trackerSocket = item.sockets.allSockets.find(isKillTrackerSocket);
    const largePerks = getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.LargePerk)
      .filter((s) => s.hasRandomizedPlugItems)
      .map((s) => s.plugged?.plugDef.hash ?? 0);
    const perkSockets = getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.Reusable);
    const traits = perkSockets
      .filter(
        (s) => ![trackerSocket?.socketIndex, weaponModSocket?.socketIndex].includes(s.socketIndex),
      )
      .map((s) => s.plugged?.plugDef.hash ?? 0);

    return { traits, masterwork, weaponMod, largePerks };
  }

  return null;
}
