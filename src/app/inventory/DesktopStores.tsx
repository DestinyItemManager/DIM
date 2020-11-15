import { t } from 'app/i18next-t';
import HeaderShadowDiv from 'app/inventory/HeaderShadowDiv';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { setSetting } from 'app/settings/actions';
import { AppIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import StoreStats from 'app/store-stats/StoreStats';
import clsx from 'clsx';
import React from 'react';
import { useDispatch } from 'react-redux';
import StoreHeading from '../character-tile/StoreHeading';
import { storeBackgroundColor } from '../shell/filters';
import D1ReputationSection from './D1ReputationSection';
import styles from './DesktopStores.m.scss';
import { InventoryBucket, InventoryBuckets } from './inventory-buckets';
import { DimStore } from './store-types';
import { StoreBuckets } from './StoreBuckets';
import { findItemsByBucket, getCurrentStore, getVault } from './stores-helpers';
import './Stores.scss';

interface Props {
  stores: DimStore[];
  buckets: InventoryBuckets;
  singleCharacter: boolean;
}
/**
 * Display inventory and character headers for all characters and the vault.
 *
 * This is the desktop view only.
 */
export default function DesktopStores({ stores, buckets, singleCharacter }: Props) {
  const vault = getVault(stores)!;
  const currentStore = getCurrentStore(stores)!;
  const dispatch = useDispatch();

  if (!stores.length || !buckets) {
    return null;
  }

  let headerStores = stores;
  if (singleCharacter) {
    headerStores = [currentStore, vault];
  }

  const toggleSingleCharacter = () => dispatch(setSetting('singleCharacter', !singleCharacter));

  return (
    <div
      className={clsx('inventory-content', `destiny${currentStore.destinyVersion}`, {
        singleCharacter,
      })}
      role="main"
      aria-label={t('Header.Inventory')}
    >
      <HeaderShadowDiv className="store-row store-header">
        {headerStores.map((store, index) => (
          <div
            className={clsx('store-cell', { vault: store.isVault })}
            key={store.id}
            style={storeBackgroundColor(store, index)}
          >
            <StoreHeading store={store} />
            <StoreStats store={store} />
          </div>
        ))}
        {stores.length > 2 && (
          <button
            type="button"
            className={styles.singleCharacterButton}
            onClick={toggleSingleCharacter}
            title={
              singleCharacter
                ? t('Settings.ExpandSingleCharacter')
                : t('Settings.SingleCharacter') + ': ' + t('Settings.SingleCharacterExplanation')
            }
          >
            <AppIcon icon={singleCharacter ? minimizeIcon : maximizeIcon} />
          </button>
        )}
      </HeaderShadowDiv>
      <StoresInventory
        stores={headerStores}
        vault={vault}
        currentStore={currentStore}
        buckets={buckets}
        singleCharacter={singleCharacter}
      />
    </div>
  );
}

/** Is there any store that has an item in any of the buckets in this category? */
function categoryHasItems(
  allBuckets: InventoryBuckets,
  category: string,
  stores: DimStore[],
  currentStore: DimStore
): boolean {
  const buckets = allBuckets.byCategory[category];
  return buckets.some((bucket) => {
    const storesToSearch = bucket.accountWide && !stores[0].isVault ? [currentStore] : stores;
    return storesToSearch.some((s) => findItemsByBucket(s, bucket.hash).length > 0);
  });
}

interface InventoryContainerProps {
  buckets: InventoryBuckets;
  stores: DimStore[];
  currentStore: DimStore;
  vault: DimStore;
  singleCharacter: boolean;
}

function CollapsibleContainer({
  buckets,
  category,
  stores,
  currentStore,
  inventoryBucket,
  vault,
  singleCharacter,
}: {
  category: string;
  inventoryBucket: InventoryBucket[];
} & InventoryContainerProps) {
  if (!categoryHasItems(buckets, category, stores, currentStore)) {
    return null;
  }

  return (
    <InventoryCollapsibleTitle title={t(`Bucket.${category}`)} sectionId={category} stores={stores}>
      {/* t('Bucket.', { context: '', contextList: 'buckets' }) */}
      {inventoryBucket.map((bucket) => (
        <StoreBuckets
          key={bucket.hash}
          bucket={bucket}
          stores={stores}
          vault={vault}
          currentStore={currentStore}
          singleCharacter={singleCharacter}
        />
      ))}
    </InventoryCollapsibleTitle>
  );
}

function StoresInventory(props: InventoryContainerProps) {
  const { buckets, stores } = props;

  return (
    <>
      {Object.entries(buckets.byCategory).map(([category, inventoryBucket]) => (
        <CollapsibleContainer
          key={category}
          {...props}
          category={category}
          inventoryBucket={inventoryBucket}
        />
      ))}
      {stores[0].destinyVersion === 1 && <D1ReputationSection stores={stores} />}
    </>
  );
}
