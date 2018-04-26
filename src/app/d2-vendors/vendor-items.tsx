import {
  DestinyItemComponentSetOfint32,
  DestinyVendorDefinition,
  DestinyVendorSaleItemComponent,
  DestinyKioskItem
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { VendorItem } from './vendor-item';
import VendorItemComponent from './VendorItemComponent';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { bungieBackgroundStyle, BungieImage } from '../dim-ui/bungie-image';
import { $state } from '../ngimport-more';
import { t } from 'i18next';
import { compact } from '../util';
import { D2Store } from '../inventory/store-types';

export default function VendorItems({
  vendorDef,
  defs,
  itemComponents,
  sales,
  kioskItems,
  trackerService,
  ownedItemHashes,
  currencyLookups
}: {
  defs: D2ManifestDefinitions;
  vendorDef: DestinyVendorDefinition;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
  kioskItems?: DestinyKioskItem[];
  trackerService?: DestinyTrackerServiceType;
  stores?: D2Store[];
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
}) {
  const reviewCache: D2ReviewDataCache | undefined = (trackerService) ? trackerService.getD2ReviewDataCache() : undefined;

  // TODO: do this stuff in setState handlers
  const items = getItems(defs, vendorDef, reviewCache, itemComponents, sales, kioskItems);

  // TODO: sort items, maybe subgroup them
  const itemsByCategory = _.groupBy(items, (item: VendorItem) => item.displayCategoryIndex);

  const faction = vendorDef.factionHash ? defs.Faction[vendorDef.factionHash] : undefined;
  const rewardVendorHash = faction && faction.rewardVendorHash || undefined;
  const rewardItem = rewardVendorHash && defs.InventoryItem.get(faction!.rewardItemHash);
  const goToRewardVendor = rewardVendorHash && (() => $state.go('destiny2.vendor', { id: rewardVendorHash }));

  const vendorCurrencyHashes = new Set<number>();
  for (const item of items) {
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
            {currencyLookups[currency.hash] || 0}{' '}
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
          {items.map((item) =>
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

// TODO: do this in parent components, pass in the right thing
function getItems(
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition,
  reviewCache?: D2ReviewDataCache,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  },
  kioskItems?: DestinyKioskItem[]
) {
  if (kioskItems) {
    return vendorDef.itemList.map((i, index) => new VendorItem(defs, vendorDef, i, reviewCache, undefined, undefined, kioskItems.some((k) => k.index === index)));
  } else if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) => new VendorItem(
      defs,
      vendorDef,
      vendorDef.itemList[component.vendorItemIndex],
      reviewCache,
      component,
      itemComponents
    ));
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.map((i) => new VendorItem(defs, vendorDef, i, reviewCache));
  }
}
