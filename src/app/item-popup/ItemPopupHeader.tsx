import { settingsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import { DamageType, DestinyAmmunitionType, DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import heavy from 'destiny-icons/general/ammo_heavy.svg';
import primary from 'destiny-icons/general/ammo_primary.svg';
import special from 'destiny-icons/general/ammo_special.svg';
import React from 'react';
import { useSelector } from 'react-redux';
import ExternalLink from '../dim-ui/ExternalLink';
import { DimItem } from '../inventory/item-types';
import styles from './ItemPopupHeader.m.scss';

const tierClassName = {
  Common: styles.common,
  Uncommon: styles.uncommon,
  Rare: styles.rare,
  Legendary: styles.legendary,
  Exotic: styles.exotic,
};

export default function ItemPopupHeader({ item }: { item: DimItem }) {
  const language = useSelector(settingsSelector).language;

  return (
    <div
      className={clsx(styles.header, tierClassName[item.tier], {
        [styles.masterwork]: item.masterwork,
        [styles.pursuit]: item.pursuit,
      })}
    >
      <div className={styles.title}>
        <ExternalLink href={destinyDBLink(item, language)}>{item.name}</ExternalLink>
      </div>

      <div className={styles.subtitle}>
        <div className={styles.type}>
          <ItemTypeName item={item} />
          {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
          {item.breakerType && (
            <BungieImage
              className={styles.breakerIcon}
              src={item.breakerType.displayProperties.icon}
            />
          )}
        </div>

        <div className={styles.details}>
          {item.element &&
            !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
              <ElementIcon element={item.element} className={styles.elementIcon} />
            )}
          <div className={styles.power}>{item.primStat?.value}</div>
          {item.powerCap && (
            <div className={styles.powerCap}>
              | {item.powerCap}{' '}
              {t('Stats.FinalSeason', {
                finalSeason: getItemPowerCapFinalSeason(item),
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ammoIcons = {
  [DestinyAmmunitionType.Primary]: primary,
  [DestinyAmmunitionType.Special]: special,
  [DestinyAmmunitionType.Heavy]: heavy,
};

function AmmoIcon({ type }: { type: DestinyAmmunitionType }) {
  return (
    <img
      className={clsx(styles.ammoIcon, {
        [styles.primary]: type === DestinyAmmunitionType.Primary,
      })}
      src={ammoIcons[type]}
    />
  );
}

function ItemTypeName({ item }: { item: DimItem }) {
  const classType =
    (item.classType !== DestinyClass.Unknown &&
      // These already include the class name
      item.type !== 'ClassItem' &&
      item.type !== 'Artifact' &&
      item.type !== 'Class' &&
      !item.classified &&
      item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1)) ||
    '';

  return (
    <div className={styles.itemType}>
      {t('MovePopup.Subtitle.Type', {
        classType,
        typeName: item.typeName,
      })}
    </div>
  );
}

function destinyDBLink(item: DimItem, language: string) {
  // DTR 404s on the new D2 languages for D1 items
  if (item.destinyVersion === 1) {
    switch (language) {
      case 'es-mx':
        language = 'es';
        break;
      case 'pl':
      case 'ru':
      case 'zh-cht':
      case 'zh-chs':
        language = 'en';
        break;
    }

    return `http://db.destinytracker.com/d${item.destinyVersion}/${language}/items/${item.hash}`;
  }

  const DimItem = item;
  let perkQueryString = '';

  if (DimItem) {
    const perkCsv = buildPerksCsv(DimItem);
    // to-do: if buildPerksCsv typing is correct, and can only return a string, lines 142-150 could be a single line
    if (perkCsv?.length) {
      perkQueryString = `?perks=${perkCsv}`;
    }
  }

  return `https://destinytracker.com/destiny-2/db/items/${item.hash}${perkQueryString}`;
}

/**
 * Banshee-44 puts placeholder entries in for the still-mysterious socketTypeHash 0.
 * If you look at Scathelocke https://data.destinysets.com/i/InventoryItem:3762467078
 * for one example, socketEntires[5] has a socketTypeHash of 0. We discard this
 * (and other sockets), as we build our definition of sockets we care about, so
 * I look for gaps in the index and drop a zero in where I see them.
 */
function buildPerksCsv(item: DimItem): string {
  const perkValues: number[] = [];

  if (item.sockets) {
    item.sockets.allSockets.forEach((socket, socketIndex) => {
      if (socketIndex > 0) {
        const currentSocketPosition = socket.socketIndex;
        const priorSocketPosition = item.sockets!.allSockets[socketIndex - 1].socketIndex;

        if (currentSocketPosition > priorSocketPosition + 1) {
          perkValues.push(0);
        }
      }

      if (socket.plugged) {
        perkValues.push(socket.plugged.plugDef.hash);
      }
    });
  }

  return perkValues.join(',');
}
