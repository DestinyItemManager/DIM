import { languageSelector } from 'app/dim-api/selectors';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { DimItem } from 'app/inventory/item-types';
import { LoreLink } from 'app/item-popup/ItemDescription';
import { useIsPhonePortrait } from 'app/shell/selectors';
import destinysets from 'images/destinysets.svg';
import destinytracker from 'images/destinytracker.png';
import logo from 'images/dimlogo.svg';
import lightgg from 'images/lightgg.png';
import React from 'react';
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
      `https://www.light.gg/db/${language}/items/${item.hash}`,
  },
  { name: 'DestinyTracker', icon: destinytracker, link: destinyDBLink },
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
      {links.map(
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
      {item.loreHash && (
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
    item.sockets.allSockets.forEach((socket) => {
      perkValues[socket.socketIndex] = socket.plugged?.plugDef.hash ?? 0;
    });
  }

  // Fill in those empty array elements
  for (let i = 0; i < perkValues.length; i++) {
    perkValues[i] ||= 0;
  }

  return perkValues.join(',');
}
