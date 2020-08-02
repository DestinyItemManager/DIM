import { t } from 'app/i18next-t';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import { VendorItem } from './vendor-item';
import FactionIcon from '../progress/FactionIcon';
import PressTip from '../dim-ui/PressTip';
import { D2Vendor } from './d2-vendors';
import styles from './VendorItems.m.scss';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { Link } from 'react-router-dom';
import spiderMats from 'data/d2/spider-mats.json';
import { VENDORS } from 'app/search/d2-known-values';

const itemSort = chainComparator<VendorItem>(
  compareBy((item) => item.item?.typeName),
  compareBy((item) => item.item?.tier),
  compareBy((item) => item.item?.icon),
  compareBy((item) => item.item?.name)
);

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  defs,
  vendor,
  ownedItemHashes,
  currencyLookups,
  filtering,
  characterId,
}: {
  defs: D2ManifestDefinitions;
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
  filtering?: boolean;
  characterId: string;
}) {
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
            vendor.def.displayCategories[categoryIndex].identifier !== 'category_preview' && (
              <div className={styles.vendorRow} key={categoryIndex}>
                <h3 className={styles.categoryTitle}>
                  {vendor.def.displayCategories[categoryIndex]?.displayProperties.name || 'Unknown'}
                </h3>
                <div className={styles.vendorItems}>
                  {items
                    .sort(itemSort)
                    .map(
                      (item) =>
                        item.item && (
                          <VendorItemComponent
                            key={item.key}
                            defs={defs}
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
