import { DestinyVendorDefinition, DestinyVendorComponent } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import { VendorItem } from './vendor-item';
import { UISref } from '@uirouter/react';
import FactionIcon from '../progress/FactionIcon';
import PressTip from '../dim-ui/PressTip';
import classNames from 'classnames';
import { hasBadge } from '../inventory/get-badge-info';

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  vendorDef,
  defs,
  vendorItems,
  vendor,
  ownedItemHashes,
  currencyLookups
}: {
  vendorDef: DestinyVendorDefinition;
  defs: D2ManifestDefinitions;
  vendorItems: VendorItem[];
  vendor?: DestinyVendorComponent;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
}) {
  // TODO: sort items, maybe subgroup them
  const itemsByCategory = _.groupBy(vendorItems, (item: VendorItem) => item.displayCategoryIndex);

  const faction = vendorDef.factionHash ? defs.Faction[vendorDef.factionHash] : undefined;
  const rewardVendorHash = (faction && faction.rewardVendorHash) || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const factionProgress = vendor && vendor.progression;

  const vendorCurrencyHashes = new Set<number>();
  for (const item of vendorItems) {
    for (const cost of item.costs) {
      vendorCurrencyHashes.add(cost.itemHash);
    }
  }
  const vendorCurrencies = _.compact(
    Array.from(vendorCurrencyHashes)
      .map((h) => defs.InventoryItem.get(h))
      .filter((i) => !i.itemCategoryHashes.includes(41))
  );

  return (
    <div className="vendor-char-items">
      {vendorCurrencies.length > 0 && (
        <div className="vendor-currencies">
          {vendorCurrencies.map((currency) => (
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
                      vendor={vendor}
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
            vendorDef.displayCategories[categoryIndex] &&
            vendorDef.displayCategories[categoryIndex].identifier !== 'category_preview' && (
              <div className="vendor-row" key={categoryIndex}>
                <h3 className="category-title">
                  {(vendorDef.displayCategories[categoryIndex] &&
                    vendorDef.displayCategories[categoryIndex].displayProperties.name) ||
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
