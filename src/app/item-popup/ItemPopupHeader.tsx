import * as React from 'react';
import { DimItem, D2Item } from '../inventory/item-types';
import ItemTagSelector from './ItemTagSelector';
import classNames from 'classnames';
import { t } from 'i18next';
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

export default function ItemPopupHeader({
  item,
  expanded,
  onToggleExpanded
}: {
  item: DimItem;
  expanded: boolean;
  onToggleExpanded(expanded: boolean): void;
}) {
  const hasLeftIcon = (item.isDestiny1() && item.trackable) || item.lockable || item.dmg;
  const b44Link = banshee44Link(item);
  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemToCompare(item, true);
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
    item.classTypeName !== 'unknown' &&
    // These already include the class name
    item.type !== 'ClassItem' &&
    item.type !== 'Artifact' &&
    item.type !== 'Class' &&
    item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1);

  return (
    <div className={classNames('item-header', `is-${item.tier}`)}>
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
        {!showDetailsByDefault && (showDescription || hasDetails) && (
          <div onClick={() => onToggleExpanded(!expanded)}>
            <AppIcon className="info" icon={expanded ? faChevronCircleUp : faChevronCircleDown} />
          </div>
        )}
      </div>

      <div className="item-subtitle">
        {hasLeftIcon && (
          <div className="icon">
            {item.dmg && item.dmg !== 'kinetic' && (
              <div className={classNames('element', item.dmg)} />
            )}
          </div>
        )}
        {item.isDestiny2() && item.ammoType > 0 && (
          <div className={classNames('ammo-type', ammoTypeClass(item.ammoType))} />
        )}
        <div className="item-type-info">
          {t('MovePopup.Subtitle', {
            light,
            statName: item.primStat && item.primStat.stat.statName,
            classType: classType ? classType : ' ',
            typeName: item.typeName,
            context: light ? 'Gear' : 'Consumable'
          })}
        </div>
        {item.objectives && !item.hidePercentage && (
          <div>{t('ItemService.PercentComplete', { percent: item.percentComplete })}</div>
        )}
        {item.taggable && <ItemTagSelector item={item} />}
      </div>

      {item.reviewable && <ExpandedRating item={item} />}

      {item.uniqueStack && (
        <div>
          {item.amount === item.maxStackSize
            ? t('MovePopup.Subtitle', { amount: item.amount, context: 'Stackable_UniqueMax' })
            : t('MovePopup.Subtitle', {
                amount: item.amount,
                maxStackSize: item.maxStackSize,
                context: 'Stackable_Unique'
              })}
        </div>
      )}
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
  } else {
    // For D2, DTR uses English for es-mx
    switch (language) {
      case 'es-mx':
        language = 'es';
        break;
    }
  }
  return `http://db.destinytracker.com/d${item.destinyVersion}/${settings.language}/items/${
    item.hash
  }`;
}

function banshee44Link(item: DimItem) {
  if (
    item.isDestiny2() &&
    item.primStat &&
    item.primStat.statHash === 1480404414 && // weapon
    item.sockets &&
    item.sockets.sockets
  ) {
    return `https://banshee-44.com/?weapon=${item.hash}&socketEntries=${buildBansheeLink(item)}`;
  }
}

/**
 * Banshee-44 puts placeholder entries in for the still-mysterious socketTypeHash 0.
 * If you look at Scathelocke https://data.destinysets.com/i/InventoryItem:3762467078
 * for one example, socketEntires[5] has a socketTypeHash of 0. We discard this
 * (and other sockets), as we build our definition of sockets we care about, so
 * I look for gaps in the index and drop a zero in where I see them.
 */
function buildBansheeLink(item: D2Item): string {
  const perkValues: number[] = [];

  item.sockets!.sockets.forEach((socket, socketIndex) => {
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

  return perkValues.join(',');
}
