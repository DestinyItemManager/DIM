import { compareFilteredItems } from 'app/compare/actions';
import { collapsedSelector, settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import { SetFilterButton } from 'app/dim-ui/SetFilterButton';
import filterButtonStyles from 'app/dim-ui/SetFilterButton.m.scss';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemPopupTab } from 'app/item-popup/ItemPopupBody';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { loadoutsByItemSelector } from 'app/loadout-drawer/selectors';
import { filterFactorySelector } from 'app/search/search-filter';
import { loadoutToSearchString } from 'app/search/search-filters/loadouts';
import { AppIcon, compareIcon, editIcon, thumbsUpIcon } from 'app/shell/icons';
import { wishListSelector } from 'app/wishlists/selectors';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import _ from 'lodash';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
// eslint-disable-next-line css-modules/no-unused-class
import popupStyles from '../item-popup/ItemDescription.m.scss';
import styles from './ItemTriage.m.scss';
import { Factor } from './triage-factors';
import { getNotableStats, getSimilarItems, getValueColors } from './triage-utils';

/** whether an item's popup should contain the triage tab */
export function doShowTriage(item: DimItem) {
  return (
    item.destinyVersion === 2 &&
    (item.bucket.inArmor ||
      (item.bucket.sort === 'Weapons' &&
        item.bucket.hash !== BucketHashes.SeasonalArtifact &&
        item.bucket.hash !== BucketHashes.Subclass))
  );
}

/**
 * the content of the upper "tab" that leads to ItemTriage when clicked.
 *
 * this is dependent on item and context:
 * when the triage pane ISN'T displayed, it will display
 * some at-a-glance info about what you'll find in the triage pane
 */
export function TriageTabToggle({ currentTab, item }: { currentTab: ItemPopupTab; item: DimItem }) {
  const wishlistRoll = useSelector(wishListSelector(item));
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const isInLoadout = Boolean(loadoutsByItem[item.id]);

  return (
    <span className="popup-tab-title">
      {t('MovePopup.TriageTab')}
      {currentTab === ItemPopupTab.Overview && (
        <>
          {wishlistRoll && (
            <span title={t('WishListRoll.BestRatedTip')}>
              <AppIcon className={clsx('thumbs-up', styles.thumbsUp)} icon={thumbsUpIcon} />
            </span>
          )}
          {isInLoadout && (
            <img title={t('Triage.InLoadouts')} src={helmet} className={styles.inLoadout} />
          )}
        </>
      )}
    </span>
  );
}

export function ItemTriage({ item }: { item: DimItem }) {
  return (
    <div className={styles.itemTriagePane}>
      {item.bucket.inWeapons && <WishlistTriageSection item={item} />}
      <LoadoutsTriageSection item={item} />
      <FactorsTriageSection item={item} />
      {item.bucket.inArmor && item.bucket.hash !== BucketHashes.ClassArmor && (
        <ArmorStatsTriageSection item={item} />
      )}
    </div>
  );
}

function WishlistTriageSection({ item }: { item: DimItem }) {
  const wishlistItem = useSelector(wishListSelector(item));
  const disabled = !wishlistItem;
  const collapsedSetting = useSelector(collapsedSelector('triage-wishlist'));
  const collapsed = disabled || collapsedSetting;
  const [alreadyOpen] = useState(collapsed);

  return (
    <CollapsibleTitle
      title={t('WishListRoll.Header')}
      sectionId="triage-wishlist"
      defaultCollapsed={false}
      extra={wishlistItem ? <AppIcon className="thumbs-up" icon={thumbsUpIcon} /> : '–'}
      disabled={disabled}
    >
      {wishlistItem?.notes?.length && (
        <ExpandableTextBlock
          linesWhenClosed={3}
          className={popupStyles.description}
          alreadyOpen={alreadyOpen}
        >
          <span className={popupStyles.wishListTextContent}>{wishlistItem.notes}</span>
        </ExpandableTextBlock>
      )}
    </CollapsibleTitle>
  );
}

function LoadoutsTriageSection({ item }: { item: DimItem }) {
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const inLoadouts = loadoutsByItem[item.id] || [];

  return (
    <CollapsibleTitle
      title={t('Triage.InLoadouts')}
      sectionId="triage-loadout"
      defaultCollapsed={true}
      extra={
        <span className={styles.factorCollapsedValue}>
          {inLoadouts.length}
          <img src={helmet} className={styles.inLoadout} />
        </span>
      }
      disabled={!inLoadouts.length}
    >
      <ul className={styles.loadoutList}>
        {inLoadouts.map((l) => {
          const edit = () => {
            editLoadout(l.loadout, item.owner, {
              isNew: false,
            });
            hideItemPopup();
          };
          return (
            <li className={styles.loadoutRow} key={l.loadout.id}>
              <ClassIcon classType={l.loadout.classType} className={styles.inlineIcon} />
              <span className={styles.loadoutName}>{l.loadout.name}</span>
              <span className={styles.controls}>
                <a
                  onClick={edit}
                  title={t('Loadouts.Edit')}
                  className={filterButtonStyles.setFilterButton}
                >
                  <AppIcon icon={editIcon} />
                </a>
                <SetFilterButton filter={loadoutToSearchString(l.loadout)} />
              </span>
            </li>
          );
        })}
      </ul>
    </CollapsibleTitle>
  );
}

/**
 * we don't include this section if there's nothing "interesting" to share about this item
 */
function FactorsTriageSection({ item }: { item: DimItem }) {
  const filterFactory = useSelector(filterFactorySelector);
  const allItems = useSelector(allItemsSelector);
  const itemFactors = getSimilarItems(item, allItems, filterFactory);

  // nothing interesting = no display
  if (itemFactors.length === 0) {
    return null;
  }

  const fewestSimilar = _.minBy(itemFactors, (f) => f.count)!.count;
  return (
    <CollapsibleTitle
      title={t('Triage.SimilarItems')}
      sectionId="triage-itemcount"
      defaultCollapsed={false}
      extra={<span className={styles.factorCollapsedValue}>{fewestSimilar}</span>}
      showExtraOnlyWhenCollapsed
    >
      <div className={styles.similarItemsTable}>
        <div className={styles.header}>
          <span>{t('Triage.ThisItem')}</span>
          <span>{t('Triage.OwnedCount')}</span>
        </div>
        <div className={styles.headerDivider} />
        {itemFactors.length > 0 &&
          itemFactors.map(({ count, query, factorCombo, items }) => (
            <div className={styles.tableRow} key={query}>
              <FactorCombo exampleItem={item} factorCombo={factorCombo} />
              <span className={styles.count}>{count}</span>
              <span className={styles.controls}>
                <StartCompareButton filter={query} items={items} />
                <SetFilterButton filter={query} />
              </span>
            </div>
          ))}
      </div>
    </CollapsibleTitle>
  );
}

function ArmorStatsTriageSection({ item }: { item: DimItem }) {
  const allItems = useSelector(allItemsSelector);
  const customTotalStatsByClass = useSelector(settingSelector('customTotalStatsByClass'));

  let extra: JSX.Element | string = '?';
  let highStats: JSX.Element | null = null;
  if (!item.classified) {
    extra = '–';

    const notableStats = getNotableStats(item, customTotalStatsByClass, allItems);
    if (notableStats.notableStats.length > 0) {
      const bestStat = _.maxBy(notableStats.notableStats, (s) => s.percent)!;
      extra = (
        <span style={{ color: getValueColors(bestStat.quality)[1] }}>{bestStat.percent}%</span>
      );

      highStats = (
        <div className={styles.statTable}>
          <div className={styles.header}>
            <div className={styles.statsHeaderLeft}>
              {t('Triage.YourBestItem')} (
              <BucketIcon className={clsx(styles.inlineIcon, styles.weaponSvg)} item={item} />)
            </div>
            <div className={styles.statsHeaderRight}>{t('Triage.ThisItem')}</div>
          </div>
          <div className={styles.statsHeaderDivider} />
          {notableStats.notableStats?.map(({ best, quality, percent, stat }) => (
            <div className={styles.tableRow} key={stat.statHash}>
              <span>
                {(stat.displayProperties.icon && (
                  <BungieImage
                    key={stat.statHash}
                    className={clsx(styles.factorIcon)}
                    src={stat.displayProperties.icon}
                  />
                )) ||
                  ' '}
              </span>
              <span className={styles.statValue}>{best}</span>
              <span className={styles.dimmed}>{stat.displayProperties.name}</span>
              <span className={styles.statValue}>{stat.base}</span>
              <span>
                (<span style={{ color: getValueColors(quality)[1] }}>{percent}%</span>)
              </span>
            </div>
          ))}
        </div>
      );
    }
  }
  return (
    <CollapsibleTitle
      title={t('Triage.HighStats')}
      sectionId="triage-highstat"
      defaultCollapsed={false}
      showExtraOnlyWhenCollapsed
      disabled={highStats === null}
      extra={extra}
    >
      {highStats}
    </CollapsibleTitle>
  );
}

function FactorCombo({
  exampleItem,
  factorCombo,
}: {
  exampleItem: DimItem;
  factorCombo: Factor[];
}) {
  return (
    <div className={styles.factorCombo}>
      {factorCombo.map((factor) => (
        <React.Fragment key={factor.id}>{factor.render(exampleItem)}</React.Fragment>
      ))}
    </div>
  );
}

function StartCompareButton({ filter, items }: { filter: string; items: DimItem[] }) {
  const dispatch = useDispatch();
  const compare = () => {
    dispatch(compareFilteredItems(filter, items));
    hideItemPopup();
  };
  const type = items[0]?.typeName;
  if (!type || items.some((i) => i.typeName !== type)) {
    return null;
  }

  return (
    <a onClick={compare} title={t('Compare.Button')} className={filterButtonStyles.setFilterButton}>
      <AppIcon icon={compareIcon} />
    </a>
  );
}
