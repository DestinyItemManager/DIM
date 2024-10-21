import { ownedItemsSelector } from 'app/inventory/selectors';
import { isEmpty } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { useSelector } from 'react-redux';
import BungieImage from '../../dim-ui/BungieImage';
import styles from '../../vendors/VendorItems.m.scss';
import D1VendorItem from './D1VendorItem';
import { Vendor, VendorCost } from './vendor.service';

/**
 * Display the items for a single vendor, organized by category.
 */
export default function D1VendorItems({
  vendor,
  totalCoins,
}: {
  vendor: Vendor;
  totalCoins: {
    [currencyHash: number]: number;
  };
}) {
  const allCurrencies: { [hash: number]: VendorCost['currency'] } = {};
  const ownedItemHashes = useSelector(ownedItemsSelector);

  for (const saleItem of vendor.allItems) {
    for (const cost of saleItem.costs) {
      allCurrencies[cost.currency.itemHash] = cost.currency;
    }
  }

  return (
    <div className={styles.vendorContents}>
      {!isEmpty(allCurrencies) && (
        <div className={styles.currencies}>
          {Object.values(allCurrencies).map((currency) => (
            <div key={currency.itemHash}>
              {totalCoins?.[currency.itemHash] || 0}{' '}
              <BungieImage
                src={currency.icon}
                className={styles.currencyIcon}
                title={currency.itemName}
              />
            </div>
          ))}
        </div>
      )}
      <div className={styles.itemCategories}>
        {vendor.categories.map((category) => (
          <div key={category.index}>
            <h3 className={styles.categoryTitle}>{category.title || 'Unknown'}</h3>
            <div className={styles.vendorItems}>
              {category.saleItems.toSorted(compareBy((i) => i.item.name)).map((item) => (
                <D1VendorItem
                  key={item.index}
                  saleItem={item}
                  owned={ownedItemHashes.accountWideOwned.has(item.item.hash)}
                  totalCoins={totalCoins}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
