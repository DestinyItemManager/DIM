import { t } from 'app/i18next-t';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import { VendorItem } from './vendor-item';
import { UISref } from '@uirouter/react';
import FactionIcon from '../progress/FactionIcon';
import PressTip from '../dim-ui/PressTip';
import classNames from 'classnames';
import { hasBadge } from '../inventory/get-badge-info';
import { D2Vendor } from './d2-vendors';
import styles from './VendorItems.m.scss';

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
  const rewardVendorHash = (faction && faction.rewardVendorHash) || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const factionProgress = vendor && vendor.component && vendor.component.progression;
  let currencies = vendor.currencies;
  if (!filtering && faction && faction.tokenValues) {
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
        {!filtering && rewardVendorHash && rewardItem && (
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
              <UISref to="destiny2.vendor" params={{ id: rewardVendorHash }}>
                <div className="item" title={rewardItem.displayProperties.name}>
                  <div
                    className="item-img transparent"
                    style={bungieBackgroundStyle(rewardItem.displayProperties.icon)}
                  />
                </div>
              </UISref>
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
                <div
                  className={classNames(styles.vendorItems, {
                    'no-badge': items.every((i) => !hasBadge(i.item))
                  })}
                >
                  {_.sortBy(items, (i) => i.displayProperties.name).map(
                    (item) =>
                      item.item && (
                        <VendorItemComponent
                          key={item.key}
                          defs={defs}
                          item={item}
                          owned={Boolean(ownedItemHashes && ownedItemHashes.has(item.item.hash))}
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
