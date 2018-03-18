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

export default function VendorItems({
  vendorDef,
  defs,
  itemComponents,
  sales,
  kioskItems
}: {
  defs: D2ManifestDefinitions;
  vendorDef: DestinyVendorDefinition;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
  kioskItems?: DestinyKioskItem[];
}) {
  // TODO: do this stuff in setState handlers
  const items = getItems(defs, vendorDef, itemComponents, sales, kioskItems);

  // TODO: sort items, maybe subgroup them
  const itemsByCategory = _.groupBy(items, (item: VendorItem) => item.displayCategoryIndex);

  return (
    <div className="vendor-char-items">
      {_.map(itemsByCategory, (items, categoryIndex) =>
        <div className="vendor-row" key={categoryIndex}>
          <h3 className="category-title">{vendorDef.displayCategories[categoryIndex] && vendorDef.displayCategories[categoryIndex].displayProperties.name || 'Unknown'}</h3>
          <div className="vendor-items">
          {items.map((item) =>
            <VendorItemComponent key={item.key} defs={defs} item={item}/>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

function getItems(
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  },
  kioskItems?: DestinyKioskItem[]
) {
  if (kioskItems) {
    return vendorDef.itemList.map((i, index) => new VendorItem(defs, vendorDef, i, undefined, undefined, kioskItems.some((k) => k.index === index)));
  } else if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) => new VendorItem(
      defs,
      vendorDef,
      vendorDef.itemList[component.vendorItemIndex],
      component,
      itemComponents
    ));
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.map((i) => new VendorItem(defs, vendorDef, i));
  }
}
