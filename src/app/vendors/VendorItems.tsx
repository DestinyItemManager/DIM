import { t } from 'app/i18next-t';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import { VendorItem } from './vendor-item';
import { UISref } from '@uirouter/react';
import FactionIcon from '../progress/FactionIcon';
import PressTip from '../dim-ui/PressTip';
import { D2Vendor } from './d2-vendors';
import styles from './VendorItems.m.scss';
import { chainComparator, compareBy } from 'app/utils/comparators';

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
  filtering
}: {
  defs: D2ManifestDefinitions;
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
  filtering?: boolean;
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
        ...currencies
      ],
      (i) => i.hash
    );
  }

  // add all traded planetmats if this vendor is the spider
  if (vendor?.component?.vendorHash === 863940356) {
    currencies = _.uniqBy(
      [
        defs.InventoryItem.get(950899352), // dusklight shards
        defs.InventoryItem.get(2014411539), // alkane dust
        defs.InventoryItem.get(3487922223), //  datalattice
        defs.InventoryItem.get(1305274547), // phaseglass
        defs.InventoryItem.get(49145143), // sim seed
        defs.InventoryItem.get(31293053), // seraphite
        defs.InventoryItem.get(1177810185), // etheric spiral
        defs.InventoryItem.get(592227263), // baryon bough
        defs.InventoryItem.get(3592324052), // helium filaments
        ...currencies
      ],
      (i) => i.hash
    );
  }

  return (
    <div className={styles.vendorContents}>
      {currencies.length > 0 && (
        <div className={styles.currencies}>
          {currencies.map((currency) => (
            <div className={styles.currency} key={currency.hash}>
              {((currencyLookups && currencyLookups[currency.hash]) || 0).toLocaleString()}{' '}
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
                <UISref to="destiny2.vendor" params={{ id: rewardVendorHash }}>
                  <div className="item" title={rewardItem.displayProperties.name}>
                    <BungieImage
                      className="item-img transparent"
                      src={rewardItem.displayProperties.icon}
                    />
                  </div>
                </UISref>
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
                  {(vendor.def.displayCategories[categoryIndex] &&
                    vendor.def.displayCategories[categoryIndex].displayProperties.name) ||
                    'Unknown'}
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
