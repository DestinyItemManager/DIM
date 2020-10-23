import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { getItemDamageShortName, getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import { DamageType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { CompareService } from '../compare/compare.service';
import ExternalLink from '../dim-ui/ExternalLink';
import { DimItem } from '../inventory/item-types';
import { AppIcon, compareIcon, faChevronCircleUp, openDropdownIcon } from '../shell/icons';
import { ammoTypeClass } from './ammo-type';
import { hideItemPopup } from './item-popup';
import './ItemPopupHeader.scss';
import { ItemSubHeader } from './ItemSubHeader';
import ItemTagSelector from './ItemTagSelector';
import LockButton from './LockButton';

export default function ItemPopupHeader({
  item,
  expanded,
  showToggle,
  language,
  isPhonePortrait,
  onToggleExpanded,
}: {
  item: DimItem;
  expanded: boolean;
  showToggle: boolean;
  language: string;
  isPhonePortrait: boolean;
  onToggleExpanded(): void;
}) {
  const hasLeftIcon = item.trackable || item.lockable || item.element;
  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  };

  const hasDetails = Boolean(
    item.stats?.length || item.talentGrid || item.objectives || item.secondaryIcon
  );
  const showDescription = Boolean(item.description?.length);
  const showDetailsByDefault = !item.equipment && item.notransfer;

  const light = item.primStat?.value.toString();

  useHotkey('c', t('Compare.ButtonHelp'), openCompare);

  const finalSeason = getItemPowerCapFinalSeason(item);
  const powerCapString =
    (light || item.powerCap) &&
    (finalSeason
      ? t('Stats.PowerCapWithSeason', { powerCap: item.powerCap, finalSeason })
      : t('MovePopup.PowerCap', { powerCap: item.powerCap }));
  return (
    <div
      className={clsx('item-header', `is-${item.tier}`, {
        masterwork: item.masterwork,
      })}
    >
      <div className="item-title-container">
        {(item.trackable || item.lockable) && (
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
        {(isPhonePortrait || !$featureFlags.newItemPopupActions) && item.comparable && (
          <a className="compare-button info" title={t('Compare.ButtonHelp')} onClick={openCompare}>
            <AppIcon icon={compareIcon} />
          </a>
        )}
        {!$featureFlags.newItemPopupActions &&
          showToggle &&
          !showDetailsByDefault &&
          (showDescription || hasDetails) && (
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
        {item.destinyVersion === 2 && item.ammoType > 0 && (
          <div className={clsx('ammo-type', ammoTypeClass(item.ammoType))} />
        )}
        {item.breakerType && (
          <BungieImage className="small-icon" src={item.breakerType.displayProperties.icon} />
        )}
        <div className="item-type-info">
          <ItemSubHeader item={item} />
        </div>
        {(isPhonePortrait || !$featureFlags.newItemPopupActions) && item.taggable && (
          <ItemTagSelector item={item} />
        )}
      </div>
      {powerCapString && (
        <div className="item-subtitle">
          <div>{`${t('Stats.PowerCap')}: ${powerCapString}`}</div>
        </div>
      )}
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
