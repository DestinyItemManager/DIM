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

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  defs,
  vendor,
  ownedItemHashes,
  currencyLookups
}: {
  defs: D2ManifestDefinitions;
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
}) {
  const itemsByCategory = _.groupBy(vendor.items, (item: VendorItem) => item.displayCategoryIndex);

  const faction = vendor.def.factionHash ? defs.Faction[vendor.def.factionHash] : undefined;
  const rewardVendorHash = (faction && faction.rewardVendorHash) || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const factionProgress = vendor && vendor.component && vendor.component.progression;

  return (
    <div className="vendor-char-items">
      {vendor.currencies.length > 0 && (
        <div className="vendor-currencies">
          {vendor.currencies.map((currency) => (
            <div className="vendor-currency" key={currency.hash}>
              {(currencyLookups && currencyLookups[currency.hash]) || 0}{' '}
              <BungieImage
                src={currency.displayProperties.icon}
                title={currency.displayProperties.name}
              />
            </div>
          ))}
        </div>
      )}
      <div className="vendor-item-categories">
        {rewardVendorHash && rewardItem && (
          <div className="vendor-row">
            <h3 className="category-title">{t('Vendors.Engram')}</h3>
            <div className="vendor-items">
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
              <div className="vendor-row" key={categoryIndex}>
                <h3 className="category-title">
                  {(vendor.def.displayCategories[categoryIndex] &&
                    vendor.def.displayCategories[categoryIndex].displayProperties.name) ||
                    'Unknown'}
                </h3>
                <div
                  className={classNames('vendor-items', {
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
