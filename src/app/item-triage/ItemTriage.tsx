import { compareFilteredItems } from 'app/compare/actions';
import { collapsedSelector, settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import { PressTip } from 'app/dim-ui/PressTip';
import { SetFilterButton } from 'app/dim-ui/SetFilterButton';
import filterButtonStyles from 'app/dim-ui/SetFilterButton.m.scss';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { I18nKey, t, tl } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import InGameLoadoutIcon from 'app/loadout/ingame/InGameLoadoutIcon';
import { isInGameLoadout } from 'app/loadout/loadout-types';
import { loadoutsByItemSelector } from 'app/loadout/selectors';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { loadoutToSearchString } from 'app/search/items/search-filters/loadouts';
import { AppIcon, compareIcon, editIcon } from 'app/shell/icons';
import WishListPerkThumb from 'app/wishlists/WishListPerkThumb';
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
import {
  getBetterWorseItems,
  getNotableStats,
  getSimilarItems,
  getValueColors,
} from './triage-utils';

/** whether an item's popup should contain the triage tab */
export function doShowTriage(item: DimItem) {
  return (
    item.destinyVersion === 2 &&
    (item.bucket.inArmor ||
      (item.bucket.sort === 'Weapons' && // there's some reason not to use inWeapons
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
export function TriageTabToggle({ tabActive, item }: { tabActive: boolean; item: DimItem }) {
  const wishlistRoll = useSelector(wishListSelector(item));
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const isInLoadout = Boolean(loadoutsByItem[item.id]);

  return (
    <span className={styles.popupTabTitle}>
      {t('MovePopup.TriageTab')}
      {!tabActive && (
        <>
          {wishlistRoll && (
            <WishListPerkThumb wishListRoll={wishlistRoll} className={styles.thumbsUp} />
          )}
          {isInLoadout && (
            <img title={t('Triage.InLoadouts')} src={helmet} className={styles.inLoadout} />
          )}
        </>
      )}
    </span>
  );
}

export function ItemTriage({ item, id }: { item: DimItem; id: string }) {
  return (
    <div id={id} role="tabpanel" aria-labelledby={`${id}-tab`} className={styles.itemTriagePane}>
      {item.wishListEnabled && <WishlistTriageSection item={item} />}
      <LoadoutsTriageSection item={item} />
      <SimilarItemsTriageSection item={item} />
      {item.bucket.inArmor && item.bucket.hash !== BucketHashes.ClassArmor && (
        <>
          <ArmorStatsTriageSection item={item} />
          <BetterItemsTriageSection item={item} />
        </>
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
      className={styles.collapseTitle}
      extra={wishlistItem ? <WishListPerkThumb wishListRoll={wishlistItem} /> : '–'}
      disabled={disabled}
    >
      {wishlistItem && Boolean(wishlistItem?.notes?.length) && (
        <ExpandableTextBlock
          linesWhenClosed={3}
          className={popupStyles.description}
          alreadyOpen={alreadyOpen}
        >
          <span className={popupStyles.secondaryText}>{wishlistItem.notes}</span>
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
      className={styles.collapseTitle}
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
          const loadout = l.loadout;
          const isDimLoadout = !isInGameLoadout(loadout);
          const edit =
            isDimLoadout &&
            (() => {
              editLoadout(loadout, item.owner, {
                isNew: false,
              });
              hideItemPopup();
            });
          return (
            <li className={styles.loadoutRow} key={loadout.id}>
              {isDimLoadout ? (
                <ClassIcon classType={loadout.classType} className={styles.inlineIcon} />
              ) : (
                <InGameLoadoutIcon loadout={loadout} />
              )}
              <ColorDestinySymbols text={loadout.name} className={styles.loadoutName} />
              <span className={styles.controls}>
                {edit && (
                  <a
                    onClick={edit}
                    title={t('Loadouts.Edit')}
                    className={filterButtonStyles.setFilterButton}
                  >
                    <AppIcon icon={editIcon} />
                  </a>
                )}
                <SetFilterButton filter={loadoutToSearchString(loadout)} />
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
function SimilarItemsTriageSection({ item }: { item: DimItem }) {
  const filterFactory = useSelector(filterFactorySelector);
  const allItems = useSelector(allItemsSelector);
  const itemFactors = getSimilarItems(item, allItems, filterFactory);

  // nothing interesting = no display
  if (itemFactors.length === 0) {
    return null;
  }

  // separate section IDs allows separate settings saves
  const sectionId = `${item.bucket.inArmor ? 'armor' : 'weapon'}-triage-itemcount`;

  const fewestSimilar = _.minBy(itemFactors, (f) => f.count)!.count;
  return (
    <CollapsibleTitle
      title={t('Triage.SimilarItems')}
      sectionId={sectionId}
      defaultCollapsed={false}
      className={styles.collapseTitle}
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
                <StartCompareButton filter={query} items={items} initialItem={item} />
                <SetFilterButton filter={query} />
              </span>
            </div>
          ))}
      </div>
    </CollapsibleTitle>
  );
}

const descriptionBulletPoints = {
  worse: [tl('Triage.StatWorseArmorDesc'), tl('Triage.PerkWorseArmorDesc')],
  worseStats: [tl('Triage.StatWorseArmorDesc'), tl('Triage.StatNotPerkArmorDesc')],
  better: [tl('Triage.StatBetterArmorDesc'), tl('Triage.PerkBetterArmorDesc')],
  betterStats: [tl('Triage.StatBetterArmorDesc'), tl('Triage.StatNotPerkArmorDesc')],
} as const;

/**
 * we don't include this section if there's no strictly better or worse items
 */
function BetterItemsTriageSection({ item }: { item: DimItem }) {
  const filterFactory = useSelector(filterFactorySelector);
  const allItems = useSelector(allItemsSelector);

  if (!item.stats) {
    return null;
  }
  const betterWorseResults = getBetterWorseItems(item, allItems, filterFactory);

  // done here if no array contains anything
  if (!Object.values(betterWorseResults).some((a) => a.length)) {
    return null;
  }

  const {
    betterItems,
    betterStatItems,
    artificeBetterItems,
    artificeBetterStatItems,
    worseItems,
    worseStatItems,
    artificeWorseItems,
    artificeWorseStatItems,
  } = betterWorseResults;

  const rows: [string, readonly [I18nKey, I18nKey], DimItem[], boolean][] = [
    [t('Triage.BetterArmor'), descriptionBulletPoints.better, betterItems, false],
    [t('Triage.WorseStatArmor'), descriptionBulletPoints.betterStats, betterStatItems, false],
    [t('Triage.BetterArtificeArmor'), descriptionBulletPoints.better, artificeBetterItems, true],
    [
      t('Triage.BetterStatArtificeArmor'),
      descriptionBulletPoints.betterStats,
      artificeBetterStatItems,
      true,
    ],
    [t('Triage.WorseArmor'), descriptionBulletPoints.worse, worseItems, false],
    [t('Triage.BetterStatArmor'), descriptionBulletPoints.worseStats, worseStatItems, false],
    [t('Triage.WorseArtificeArmor'), descriptionBulletPoints.worse, artificeWorseItems, true],
    [
      t('Triage.WorseStatArtificeArmor'),
      descriptionBulletPoints.worseStats,
      artificeWorseStatItems,
      true,
    ],
  ];

  return (
    <CollapsibleTitle
      title={t('Triage.BetterWorseArmor')}
      sectionId="better-worse-armor"
      defaultCollapsed={false}
      className={styles.collapseTitle}
      extra={<span className={styles.factorCollapsedValue}>!!</span>}
      showExtraOnlyWhenCollapsed
    >
      <div className={styles.similarItemsTable}>
        {rows.map(([label, [statDesc, perkDesc], itemCollection, showArtificeDesc]) => {
          const tooltip = (
            <>
              {t('Triage.BetterWorseIncludes')}
              <ul>
                <li>
                  {t(statDesc)}
                  {showArtificeDesc && (
                    <span className={styles.artificeExplanation}>
                      <br />
                      {t('Triage.AccountsForArtifice')}
                    </span>
                  )}
                </li>
                <li>{t(perkDesc)}</li>
              </ul>
            </>
          );
          if (itemCollection.length) {
            const filter = itemCollection.map((i) => `id:${i.id}`).join(' or ');
            return (
              <div className={styles.tableRow} key={label}>
                <span>
                  <PressTip tooltip={tooltip} elementType="span" placement="top">
                    {label}
                  </PressTip>
                </span>
                <span className={styles.count}>{itemCollection.length}</span>
                <span className={styles.controls}>
                  <StartCompareButton
                    filter={`id:${item.id} or ${filter}`}
                    items={itemCollection}
                    initialItem={item}
                  />
                </span>
              </div>
            );
          }
        })}
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
              <BucketIcon
                className={clsx(styles.inlineIcon, styles.weaponSvg)}
                bucketHash={item.bucket.hash}
              />
              )
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
                    className={styles.factorIcon}
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
      className={styles.collapseTitle}
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

function StartCompareButton({
  filter,
  items,
  initialItem,
}: {
  filter: string;
  items: DimItem[];
  /** The first item added to compare, so we can highlight it. */
  initialItem: DimItem;
}) {
  const dispatch = useDispatch();
  const compare = () => {
    dispatch(compareFilteredItems(filter, items, initialItem));
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
