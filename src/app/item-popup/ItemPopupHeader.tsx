import React from 'react';
import { DimItem, D2Item } from '../inventory/item-types';
import ItemTagSelector from './ItemTagSelector';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import LockButton from './LockButton';
import ExternalLink from '../dim-ui/ExternalLink';
import { AppIcon, faClone, faChevronCircleUp, openDropdownIcon } from '../shell/icons';
import { CompareService } from '../compare/compare.service';
import { ammoTypeClass } from './ammo-type';
import ExpandedRating from './ExpandedRating';
import './ItemPopupHeader.scss';
import { hideItemPopup } from './item-popup';
import { DestinyClass, DamageType } from 'bungie-api-ts/destiny2';
import ElementIcon from 'app/inventory/ElementIcon';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import { PowerCapDisclaimer } from 'app/dim-ui/PowerCapDisclaimer';
import BungieImage from 'app/dim-ui/BungieImage';
import { useHotkey } from 'app/hotkeys/useHotkey';

export default function ItemPopupHeader({
  item,
  expanded,
  showToggle,
  language,
  onToggleExpanded,
}: {
  item: DimItem;
  expanded: boolean;
  showToggle: boolean;
  language: string;
  onToggleExpanded(): void;
}) {
  const hasLeftIcon = item.trackable || item.lockable || item.element;
  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  };

  const hasDetails = Boolean(
    item.stats?.length ||
      item.talentGrid ||
      item.objectives ||
      (item.isDestiny2() && item.flavorObjective) ||
      item.secondaryIcon
  );
  const showDescription = Boolean(item.description?.length);
  const showDetailsByDefault = !item.equipment && item.notransfer;

  const light = item.primStat?.value.toString();
  const maxLight = item.isDestiny2() && item.powerCap;

  useHotkey('t', t('Hotkey.ToggleDetails'), onToggleExpanded);

  const classType =
    item.classType !== DestinyClass.Unknown &&
    // These already include the class name
    item.type !== 'ClassItem' &&
    item.type !== 'Artifact' &&
    item.type !== 'Class' &&
    !item.classified &&
    item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1);

  const subtitleData = {
    light,
    maxLight,
    statName: item.primStat?.stat.displayProperties.name,
    classType: classType ? classType : ' ',
    typeName: item.typeName,
  };

  const lightString = light
    ? t('MovePopup.Subtitle.Gear', subtitleData)
    : t('MovePopup.Subtitle.Consumable', subtitleData);

  const finalSeason = item.isDestiny2() && item.powerCap && getItemPowerCapFinalSeason(item);
  const powerCapString =
    light &&
    maxLight &&
    (finalSeason
      ? t('Stats.PowerCapWithSeason', { powerCap: maxLight, finalSeason })
      : t('MovePopup.PowerCap', { powerCap: maxLight }));
  return (
    <div
      className={clsx('item-header', `is-${item.tier}`, {
        masterwork: item.isDestiny2() && item.masterwork,
      })}
    >
      <div className="item-title-container">
        {hasLeftIcon && (
          <div className="icon">
            {item.lockable && <LockButton item={item} type="lock" />}
            {item.trackable && <LockButton item={item} type="track" />}
          </div>
        )}
        <div className="item-title-link">
          <ExternalLink href={destinyDBLink(item, language)} className="item-title">
            {item.name}
          </ExternalLink>
        </div>
        {item.comparable && (
          <a className="compare-button info" title={t('Compare.ButtonHelp')} onClick={openCompare}>
            <AppIcon icon={faClone} />
          </a>
        )}
        {showToggle && !showDetailsByDefault && (showDescription || hasDetails) && (
          <div className="info" onClick={onToggleExpanded}>
            <AppIcon icon={expanded ? faChevronCircleUp : openDropdownIcon} />
          </div>
        )}
      </div>

      <div className="item-subtitle">
        {hasLeftIcon &&
          item.element &&
          !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
            <div className="icon">
              <ElementIcon
                element={item.element}
                className={clsx('element', getItemDamageShortName(item))}
              />
            </div>
          )}
        {item.isDestiny2() && item.ammoType > 0 && (
          <div className={clsx('ammo-type', ammoTypeClass(item.ammoType))} />
        )}
        {item.isDestiny2() && item.breakerType && (
          <BungieImage className="small-icon" src={item.breakerType.displayProperties.icon} />
        )}
        <div className="item-type-info">{lightString}</div>
        {item.taggable && <ItemTagSelector item={item} />}
      </div>
      {powerCapString && (
        <div className="item-subtitle">
          <div>{`${t('Stats.PowerCap')}: ${powerCapString}`}</div>
          <PowerCapDisclaimer item={item} />
        </div>
      )}
      {$featureFlags.reviewsEnabled && item.reviewable && <ExpandedRating item={item} />}
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

  const d2Item = item as D2Item;
  let perkQueryString = '';

  if (d2Item) {
    const perkCsv = buildPerksCsv(d2Item);
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
function buildPerksCsv(item: D2Item): string {
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
