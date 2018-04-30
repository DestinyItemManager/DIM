import { D2ItemListBuilder } from './d2-itemListBuilder';
import { DtrBulkItem, DtrItem } from '../item-review/destiny-tracker.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';
import { loadingTracker } from '../ngimport-more';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Store } from '../inventory/store-types';
import { dtrFetch } from './dtr-service-helper';

class D2BulkFetcher {
  _reviewDataCache: D2ReviewDataCache;
  _itemListBuilder = new D2ItemListBuilder();

  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkFetchPromise(stores: D2Store[], platformSelection: number, mode: number): Promise<DtrBulkItem[]> {
    if (!stores.length) {
      return Promise.resolve<DtrBulkItem[]>([]);
    }

    const itemList = this._itemListBuilder.getItemList(stores, this._reviewDataCache);
    return this._getBulkItems(itemList, platformSelection, mode);
  }

  _getVendorBulkFetchPromise(platformSelection: number,
                             mode: number,
                             vendorSaleItems?: DestinyVendorSaleItemComponent[],
                             vendorItems?: DestinyVendorItemDefinition[]): Promise<DtrBulkItem[]> {
    if ((vendorSaleItems && !vendorSaleItems.length) || (vendorItems && !vendorItems.length)) {
      return Promise.resolve<DtrBulkItem[]>([]);
    }

    const vendorDtrItems = this._itemListBuilder.getVendorItemList(this._reviewDataCache, vendorSaleItems, vendorItems);
    return this._getBulkItems(vendorDtrItems, platformSelection, mode);
  }

  _getBulkItems(itemList: DtrItem[], platformSelection: number, mode: number): Promise<DtrBulkItem[]> {
    if (!itemList.length) {
      return Promise.resolve<DtrBulkItem[]>([]);
    }

    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews/fetch?platform=${platformSelection}&mode=${mode}`,
      itemList
    ).then(handleD2Errors, handleD2Errors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   */
  bulkFetch(stores: D2Store[], platformSelection: number, mode: number) {
    this._getBulkFetchPromise(stores, platformSelection, mode)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores));
  }

  _addScores(bulkRankings: DtrBulkItem[] | null): void {
    this._reviewDataCache.addScores(bulkRankings);
  }

  getCache(): D2ReviewDataCache {
    return this._reviewDataCache;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(platformSelection: number,
                       mode: number,
                       vendorSaleItems?: DestinyVendorSaleItemComponent[],
                       vendorItems?: DestinyVendorItemDefinition[]): Promise<void> {
    return this._getVendorBulkFetchPromise(platformSelection, mode, vendorSaleItems, vendorItems)
      .then((bulkRankings) => this._addScores(bulkRankings));
  }

  attachRankings(bulkRankings: DtrBulkItem[] | null,
                 stores: D2Store[]): void {
    if (!bulkRankings && !stores) {
      return;
    }

    this._addScores(bulkRankings);

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const matchingItem = this._reviewDataCache.getRatingData(storeItem);

          if (matchingItem) {
            storeItem.dtrRating = matchingItem.rating;
            storeItem.dtrRatingCount = matchingItem.votes.total;
            storeItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
            storeItem.userVote = matchingItem.userVote;
            storeItem.userReview = matchingItem.text;
            storeItem.pros = matchingItem.pros;
            storeItem.cons = matchingItem.cons;
          }
        }
      });
    });
  }

  attachVendorRankings(bulkRankings,
                       vendors): void {
    if (!bulkRankings && !vendors) {
      return;
    }

    if (bulkRankings) {
      this._reviewDataCache.addScores(bulkRankings);
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItemContainer) => {
        const vendorItem = vendorItemContainer.item;

        const matchingItem = this._reviewDataCache.getRatingData(vendorItem);

        if (matchingItem) {
          vendorItem.dtrRating = matchingItem.rating;
          vendorItem.dtrRatingCount = matchingItem.totalReviews;
          vendorItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
          vendorItem.userRating = matchingItem.userRating;
          vendorItem.userReview = matchingItem.review;
          vendorItem.pros = matchingItem.pros;
          vendorItem.cons = matchingItem.cons;
        }
      });
    });
  }
}

export { D2BulkFetcher };
