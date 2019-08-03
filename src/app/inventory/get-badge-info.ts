import { t } from 'app/i18next-t';
import { DimItem } from './item-types';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import idx from 'idx';
import { weakMemoize } from 'app/util';

export interface BadgeInfo {
  showBadge: boolean;
  badgeClassNames: {
    [key: string]: boolean;
  };
  badgeCount: string;
  isCapped: boolean;
}

const getGhostInfos = weakMemoize((item: DimItem) =>
  item.isDestiny2() && item.sockets
    ? _.compact(
        item.sockets.sockets.map((s) => {
          const hash = idx(s.plug, (p) => p.plugItem.hash);
          return hash && ghostPerks[hash];
        })
      )
    : []
);

export function hasBadge(item?: DimItem | null): boolean {
  if (!item) {
    return false;
  }
  return (
    Boolean(item.primStat && item.primStat.value) ||
    item.classified ||
    (item.objectives && !item.complete && !item.hidePercentage) ||
    (item.maxStackSize > 1 && item.amount > 1) ||
    Boolean(item.itemCategoryHashes.includes(39) && getGhostInfos(item).length)
  );
}

export default function getBadgeInfo(item: DimItem): BadgeInfo {
  if (!item.primStat && item.objectives) {
    return processBounty(item);
  } else if (item.maxStackSize > 1) {
    return processStackable(item);
  } else if (item.itemCategoryHashes.includes(39)) {
    return processGhost(item);
  } else {
    return processItem(item);
  }
}

function processBounty(item: DimItem) {
  const showBountyPercentage = !item.complete && !item.hidePercentage;

  const result = {
    showBadge: showBountyPercentage,
    badgeClassNames: {},
    badgeCount: '',
    isCapped: false
  };

  if (showBountyPercentage) {
    result.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
    result.badgeCount = `${Math.floor(100 * item.percentComplete)}%`;
  }

  return result;
}

function processStackable(item: DimItem) {
  const isCapped = item.amount === item.maxStackSize && item.uniqueStack;
  return {
    showBadge: item.amount > 1,
    badgeClassNames: {
      'item-stat': true,
      'item-stackable-max': item.amount === item.maxStackSize,
      'badge-capped': isCapped
    },
    badgeCount: isCapped ? t('Badge.Max') : item.amount.toString(),
    isCapped
  };
}

function processGhost(item: DimItem) {
  const infos = getGhostInfos(item);

  /*
  t('Ghost.edz');
  t('Ghost.titan');
  t('Ghost.nessus');
  t('Ghost.io');
  t('Ghost.mercury');
  t('Ghost.mars');
  t('Ghost.tangled');
  t('Ghost.dreaming');
  t('Ghost.strikes');
  t('Ghost.crucible');
  t('Ghost.gambit');
  t('Ghost.leviathan');
  */
  const name = _.uniq(infos.map((i) => i.location).filter((l) => l !== true && l !== false))
    .map((i) => t(`Ghost.${i.location}`))
    .join(',');
  const improved = infos.some((i) => i.type.improved);

  return {
    showBadge: Boolean(infos.length) || item.classified,
    badgeClassNames: {
      'item-stat': true,
      'item-equipment': true
    },
    badgeCount: item.classified ? '???' : infos.length ? `${name}${improved ? '+' : ''}` : '',
    isCapped: false
  };
}

function processItem(item: DimItem) {
  const result = {
    showBadge: Boolean(item.primStat && item.primStat.value) || item.classified,
    badgeClassNames: {
      'item-equipment': true
    },
    badgeCount: '',
    isCapped: false
  };
  if (item.primStat && result.showBadge) {
    result.badgeClassNames['item-stat'] = true;
    result.badgeCount = item.primStat.value.toString();
  }
  if (item.classified) {
    result.badgeClassNames['item-stat'] = true;
    result.badgeCount = '???';
  }
  return result;
}
