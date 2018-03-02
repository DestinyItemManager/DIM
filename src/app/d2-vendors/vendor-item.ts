import { DestinyVendorItemDefinition, DestinyVendorSaleItemComponent, DestinyItemComponentSetOfint32, DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { equals } from 'angular';

/**
 * A displayable vendor item. The only state it holds is raw responses/definitions - all
 * display properties are computed. The item itself is immutable and should be cheap to
 * construct, and relatively cheap to compare.
 *
 * This is the pattern I want to follow for our main items!
 */
export class VendorItem {
  private vendorItemDef: DestinyVendorItemDefinition;
  private saleItem?: DestinyVendorSaleItemComponent;
  private inventoryItem: DestinyInventoryItemDefinition;
  // TODO: each useful component

  private defs: D2ManifestDefinitions;

  constructor(
    defs: D2ManifestDefinitions,
    vendorItemDef: DestinyVendorItemDefinition,
    saleItem?: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    _itemComponents?: DestinyItemComponentSetOfint32
  ) {
    this.defs = defs;
    this.vendorItemDef = vendorItemDef;
    this.saleItem = saleItem;
    this.inventoryItem = this.defs.InventoryItem.get(this.vendorItemDef.itemHash);
  }

  get key() {
    return this.saleItem ? this.saleItem.vendorItemIndex : this.vendorItemDef.itemHash;
  }

  get itemHash() {
    return this.vendorItemDef.itemHash;
  }

  // TODO: I'm not sold on having a bunch of property getters, vs just exposing the raw underlying stuff

  get displayProperties() {
    return this.inventoryItem.displayProperties;
  }

  /**
   * Should this item display "borderless" (vs. in a box)
   */
  get borderless() {
    return Boolean(this.inventoryItem.uiItemDisplayStyle);
  }

  /**
   * Should it display as a wide tile?
   */
  get displayTile() {
    return this.inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container';
  }

  /**
   * Should this be displayed in a vendor?
   */
  get canBeSold() {
    return (!this.saleItem || this.saleItem.failureIndexes.length === 0);
  }

  /**
   * What category should this be shown in?
   */
  get displayCategoryIndex() {
    return this.vendorItemDef.displayCategoryIndex;
  }

  get costs() {
    return (this.saleItem && this.saleItem.costs) || [];
  }

  equals(other: VendorItem) {
    // Defs can be ref-compared
    return this.vendorItemDef === other.vendorItemDef &&
      // Deep equals
      equals(this.saleItem, other.saleItem);
  }
}
