import {
  DestinyItemComponentSetOfint32,
  DestinyVendorDefinition,
  DestinyVendorItemDefinition,
  DestinyVendorSaleItemComponent
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { VendorItem } from './vendor-item';
import { VendorItemComponent } from './vendor-item-component';

export default function VendorItems({
  vendorDef,
  defs,
  itemComponents,
  sales
}: {
  defs: D2ManifestDefinitions;
  vendorDef: DestinyVendorDefinition;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
}) {
  // TODO: do this stuff in setState handlers
  const items = sales && itemComponents
    ? toItemList(defs, itemComponents, vendorDef.itemList, sales)
    // If the sales should come from the server, don't show all possibilities here
    : (vendorDef.returnWithVendorRequest ? [] : vendorDef.itemList.map((i) => new VendorItem(defs, i)));

  // TODO: sort items, maybe subgroup them
  const itemsByCategory = _.groupBy(items.filter((i) => i.canBeSold), (item: VendorItem) => item.displayCategoryIndex);

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

function toItemList(
  defs: D2ManifestDefinitions,
  itemComponents: DestinyItemComponentSetOfint32,
  itemList: DestinyVendorItemDefinition[],
  sales: {
    [key: string]: DestinyVendorSaleItemComponent;
  }
): VendorItem[] {
  const components = Object.values(sales);
  return components.map((component) => new VendorItem(
    defs,
    itemList[component.vendorItemIndex],
    component,
    itemComponents
  ));
}
