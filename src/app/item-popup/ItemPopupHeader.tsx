import React from 'react';
import { DimItem, D2Item } from '../inventory/item-types';
import ItemTagSelector from './ItemTagSelector';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import LockButton from './LockButton';
import ExternalLink from '../dim-ui/ExternalLink';
import { settings } from '../settings/settings';
import { AppIcon } from '../shell/icons';
import { faGift, faChevronCircleUp, faChevronCircleDown } from '@fortawesome/free-solid-svg-icons';
import { faClone } from '@fortawesome/free-regular-svg-icons';
import { CompareService } from '../compare/compare.service';
import { ammoTypeClass } from './ammo-type';
import ExpandedRating from './ExpandedRating';
import './ItemPopupHeader.scss';
import { hideItemPopup } from './item-popup';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { DestinyClass } from 'bungie-api-ts/destiny2';

export default function ItemPopupHeader({
  item,
  expanded,
  showToggle,
  onToggleExpanded
}: {
  item: DimItem;
  expanded: boolean;
  showToggle: boolean;
  onToggleExpanded(): void;
}) {
  const hasLeftIcon = (item.isDestiny1() && item.trackable) || item.lockable || item.dmg;
  const b44Link = banshee44Link(item);
  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  };

  const hasDetails = Boolean(
    (item.stats && item.stats.length) ||
      item.talentGrid ||
      item.objectives ||
      (item.isDestiny2() && item.flavorObjective) ||
      item.secondaryIcon
  );
  const showDescription = Boolean(item.description && item.description.length);
  const showDetailsByDefault = !item.equipment && item.notransfer;

  const light = item.primStat ? item.primStat.value.toString() : undefined;

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
    statName: item.primStat && item.primStat.stat.displayProperties.name,
    classType: classType ? classType : ' ',
    typeName: item.typeName
  };

  return (
    <div
      className={clsx('item-header', `is-${item.tier}`, {
        masterwork: item.isDestiny2() && item.masterwork
      })}
    >
      <GlobalHotkeys
        hotkeys={[
          { combo: 't', description: t('Hotkey.ToggleDetails'), callback: onToggleExpanded }
        ]}
      />
      <div className="item-title-container">
        {hasLeftIcon && (
          <div className="icon">
            {item.lockable && <LockButton item={item} type="lock" />}
            {item.isDestiny1() && item.trackable && <LockButton item={item} type="track" />}
          </div>
        )}
        <div className="item-title-link">
          <ExternalLink href={destinyDBLink(item)} className="item-title">
            {item.name}
          </ExternalLink>
        </div>
        {b44Link && (
          <ExternalLink href={b44Link} className="info">
            <AppIcon icon={faGift} title={t('CuratedRoll.Header')} />
          </ExternalLink>
        )}
        {item.comparable && (
          <a className="compare-button info" title={t('Compare.ButtonHelp')} onClick={openCompare}>
            <AppIcon icon={faClone} />
          </a>
        )}
        {showToggle && !showDetailsByDefault && (showDescription || hasDetails) && (
          <div onClick={onToggleExpanded}>
            <AppIcon className="info" icon={expanded ? faChevronCircleUp : faChevronCircleDown} />
          </div>
        )}
      </div>

      <div className="item-subtitle">
        {hasLeftIcon && (
          <div className="icon">
            {item.dmg && item.dmg !== 'kinetic' && <div className={clsx('element', item.dmg)} />}
          </div>
        )}
        {item.isDestiny2() && item.ammoType > 0 && (
          <div className={clsx('ammo-type', ammoTypeClass(item.ammoType))} />
        )}
        <div className="item-type-info">
          {light
            ? t('MovePopup.Subtitle.Gear', subtitleData)
            : t('MovePopup.Subtitle.Consumable', subtitleData)}
        </div>
        {item.taggable && <ItemTagSelector item={item} />}
      </div>

      {item.reviewable && <ExpandedRating item={item} />}
    </div>
  );
}

function destinyDBLink(item: DimItem) {
  // DTR 404s on the new D2 languages for D1 items
  let language = settings.language;
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

    return `http://db.destinytracker.com/d${item.destinyVersion}/${settings.language}/items/${item.hash}`;
  }

  const d2Item = item as D2Item;
  let perkQueryString: string | null = null;

  if (d2Item) {
    const perkCsv = buildPerksCsv(d2Item);

    if (perkCsv && perkCsv.length > 0) {
      perkQueryString = `&perks=${perkCsv}`;
    }
  }

  return `https://destinytracker.com/destiny-2/db/items/${item.hash}${perkQueryString}`;
}

function banshee44Link(item: DimItem) {
  if (
    item.isDestiny2() &&
    item.primStat &&
    item.primStat.statHash === 1480404414 && // weapon
    item.sockets &&
    item.sockets.sockets
  ) {
    return `https://banshee-44.com/?weapon=${item.hash}&socketEntries=${buildPerksCsv(item)}`;
  }
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
    item.sockets.sockets.forEach((socket, socketIndex) => {
      if (socketIndex > 0) {
        const currentSocketPosition = socket.socketIndex;
        const priorSocketPosition = item.sockets!.sockets[socketIndex - 1].socketIndex;

        if (currentSocketPosition > priorSocketPosition + 1) {
          perkValues.push(0);
        }
      }

      if (socket.plug) {
        perkValues.push(socket.plug.plugItem.hash);
      }
    });
  }

  return perkValues.join(',');
}
