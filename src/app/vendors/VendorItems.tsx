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

function vendorItemIndex(item: VendorItem) {
  return item.key;
}

// Fix for ada-1 bounties ... https://github.com/Bungie-net/api/issues/1522
// changes their sort to match the game
const transmogBountyOrder = [
  1455474223, // Vanguard
  3675595381, // Crucible
  2259349108, // Gambit
  4187422269, // Destination
  171866827, // Raid/Dungeon
];

function itemSort(vendorHash: number, category: string) {
  if (category === 'category.rank_rewards_seasonal') {
    return chainComparator<VendorItem>(
      compareBy((item) => item.item?.tier),
      compareBy(vendorItemIndex)
    );
  } else if (category === 'category_bounties') {
    if (vendorHash === VENDORS.ADA_TRANSMOG) {
      return compareBy<VendorItem>(
        (item) => item.item?.hash && transmogBountyOrder.indexOf(item.item.hash)
      );
    } else {
      return chainComparator<VendorItem>(
        compareBy((item) => item.item?.typeName),
        compareBy(vendorItemIndex)
      );
    }
  } else if (category === 'category_weapon') {
    return chainComparator<VendorItem>(compareBy((item) => item.item?.itemCategoryHashes[0]));
  } else if (category.startsWith('category_tier')) {
    return undefined;
  } else {
    return chainComparator<VendorItem>(compareBy(vendorItemIndex));
  }
}

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
        {((rewardVendorHash && rewardItem) || (factionProgress && faction)) && (
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
                <Link to={`../vendors/${rewardVendorHash}?characterId=${characterId}`}>
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
                    .sort(
                      itemSort(
                        vendor.def.hash,
                        vendor.def.displayCategories[categoryIndex]?.identifier
                      )
                    )
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
