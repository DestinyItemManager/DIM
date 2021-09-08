import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { VENDORS } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import spiderMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';
import FactionIcon from '../progress/FactionIcon';
import { D2Vendor } from './d2-vendors';
import { VendorItem } from './vendor-item';
import VendorItemComponent from './VendorItemComponent';
import styles from './VendorItems.m.scss';

const itemSort = chainComparator<VendorItem>(
  compareBy((item) => (item.item?.bucket.name === 'Quests' ? item.item?.typeName : '')),
  compareBy((item) =>
    item.item?.bucket.sort === 'Weapons'
      ? item.item?.itemCategoryHashes
      : parseInt(item.item?.id ?? '', 10)
  ),
  compareBy((item) => (item.item?.bucket.sort !== 'Weapons' ? item.item?.itemCategoryHashes : ''))
);

const rankRewardsSort = chainComparator<VendorItem>(
  compareBy((item) => item.item?.tier),
  compareBy((item) => parseInt(item.item?.id ?? '', 10)),
)

// ignore what i think is the loot pool preview on some tower vendors?
// ignore the "reset artifact" button on artifact "vendor"
const ignoreCategories = ['category_preview', 'category_reset'];

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  vendor,
  ownedItemHashes,
  currencyLookups,
  filtering,
  characterId,
}: {
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
  filtering?: boolean;
  characterId: string;
}) {
  const defs = useD2Definitions()!;
  const itemsByCategory = _.groupBy(vendor.items, (item: VendorItem) => item.displayCategoryIndex);

  const faction = vendor.def.factionHash ? defs.Faction[vendor.def.factionHash] : undefined;
  const rewardVendorHash = faction?.rewardVendorHash || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const factionProgress = vendor?.component?.progression;
  let currencies = vendor.currencies;

  // add in faction tokens if this vendor has them
  if (!filtering && faction?.tokenValues) {
    currencies = _.uniqBy(
      [
        ...Object.keys(faction.tokenValues)
          .map((h) => defs.InventoryItem.get(parseInt(h, 10)))
          .filter(Boolean),
        ...currencies,
      ],
      (i) => i.hash
    );
  }

  // add all traded planetmats if this vendor is the spider
  if (vendor?.component?.vendorHash === VENDORS.SPIDER) {
    currencies = _.uniqBy(
      [...spiderMats.map((h) => defs.InventoryItem.get(h)), ...currencies],
      (i) => i.hash
    );
  }

  return (
    <div className={styles.vendorContents}>
      {currencies.length > 0 && (
        <div className={styles.currencies}>
          {currencies.map((currency) => (
            <div className={styles.currency} key={currency.hash}>
              {(currencyLookups?.[currency.hash] || 0).toLocaleString()}{' '}
              <BungieImage
                src={currency.displayProperties.icon}
                title={currency.displayProperties.name}
              />
            </div>
          ))}
        </div>
      )}
      <div className={styles.itemCategories}>
        {!filtering && ((rewardVendorHash && rewardItem) || (factionProgress && faction)) && (
          <div className={styles.vendorRow}>
            <h3 className={styles.categoryTitle}>{t('Vendors.Engram')}</h3>
            <div className={styles.vendorItems}>
              {factionProgress && faction && (
                <PressTip
                  tooltip={`${factionProgress.progressToNextLevel}/${factionProgress.nextLevelAt}`}
                >
                  <div>
                    <FactionIcon
                      factionProgress={factionProgress}
                      factionDef={faction}
                      vendor={vendor.component}
                    />
                  </div>
                </PressTip>
              )}
              {rewardVendorHash && rewardItem && (
                <Link to={`vendors/${rewardVendorHash}?characterId=${characterId}`}>
                  <div className="item" title={rewardItem.displayProperties.name}>
                    <BungieImage
                      className="item-img transparent"
                      src={rewardItem.displayProperties.icon}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
        {_.map(
          itemsByCategory,
          (items, categoryIndex) =>
            vendor.def.displayCategories[categoryIndex] &&
            !ignoreCategories.includes(vendor.def.displayCategories[categoryIndex].identifier) && (
              <div className={styles.vendorRow} key={categoryIndex}>
                <h3 className={styles.categoryTitle}>
                  {vendor.def.displayCategories[categoryIndex]?.displayProperties.name || 'Unknown'}
                </h3>
                <div className={styles.vendorItems}>
                  {items
                    .sort(vendor.def.displayCategories[categoryIndex]?.identifier === "category.rank_rewards_seasonal" ? rankRewardsSort : itemSort)
                    .map(
                      (item) =>
                        item.item && (
                          <VendorItemComponent
                            key={item.key}
                            item={item}
                            owned={Boolean(ownedItemHashes?.has(item.item.hash))}
                            characterId={characterId}
                          />
                        )
                    )}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
