import { DestinyVendorDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage, bungieBackgroundStyle } from '../dim-ui/bungie-image';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { $state } from '../ngimport-more';
import { compact } from '../util';
import VendorItemComponent from './VendorItemComponent';
import { VendorItem } from './vendor-item';

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  vendorDef,
  defs,
  vendorItems,
  trackerService,
  ownedItemHashes,
  currencyLookups
}: {
  vendorDef: DestinyVendorDefinition;
  defs: D2ManifestDefinitions;
  vendorItems: VendorItem[];
  trackerService?: DestinyTrackerServiceType;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
}) {
  // TODO: sort items, maybe subgroup them
  const itemsByCategory = _.groupBy(vendorItems, (item: VendorItem) => item.displayCategoryIndex);

  const faction = vendorDef.factionHash ? defs.Faction[vendorDef.factionHash] : undefined;
  const rewardVendorHash = faction && faction.rewardVendorHash || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const goToRewardVendor = rewardVendorHash && (() => $state.go('destiny2.vendor', { id: rewardVendorHash }));

  const vendorCurrencyHashes = new Set<number>();
  for (const item of vendorItems) {
    for (const cost of item.costs) {
      vendorCurrencyHashes.add(cost.itemHash);
    }
  }
  const vendorCurrencies = compact(Array.from(vendorCurrencyHashes).map((h) => defs.InventoryItem.get(h)));

  return (
    <div className="vendor-char-items">
      {vendorCurrencies.length > 0 && <div className="vendor-currencies">
        {vendorCurrencies.map((currency) =>
          <div className="vendor-currency" key={currency.hash}>
            {(currencyLookups && currencyLookups[currency.hash]) || 0}{' '}
            <BungieImage src={currency.displayProperties.icon} title={currency.displayProperties.name}/>
          </div>
        )}
      </div>}
      {rewardVendorHash && rewardItem && goToRewardVendor &&
        <div className="vendor-row">
          <h3 className="category-title">{t('Vendors.Engram')}</h3>
          <div className="item" title={rewardItem.displayProperties.name} onClick={goToRewardVendor}>
            <div
              className="item-img transparent"
              style={bungieBackgroundStyle(rewardItem.displayProperties.icon)}
            />
          </div>
        </div>}
      {_.map(itemsByCategory, (items, categoryIndex) =>
        <div className="vendor-row" key={categoryIndex}>
          <h3 className="category-title">{vendorDef.displayCategories[categoryIndex] && vendorDef.displayCategories[categoryIndex].displayProperties.name || 'Unknown'}</h3>
          <div className="vendor-items">
          {_.sortBy(items, (i) => i.displayProperties.name).map((item) =>
            <VendorItemComponent
              key={item.key}
              defs={defs}
              item={item}
              trackerService={trackerService}
              owned={Boolean(ownedItemHashes && ownedItemHashes.has(item.itemHash))}
            />
          )}
          </div>
        </div>
      )}
    </div>
  );
}
