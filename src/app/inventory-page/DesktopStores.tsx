import { itemPop } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { BucketSortType, InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { locateItem$ } from 'app/inventory/locate-item';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket, getCurrentStore, getVault } from 'app/inventory/stores-helpers';
import IssueAwarenessBanner from 'app/issue-awareness-banner/IssueAwarenessBanner';
import ItemFeedSidebar from 'app/item-feed/ItemFeedSidebar';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import StoreStats from 'app/store-stats/StoreStats';
import { useEventBusListener } from 'app/utils/hooks';
import { isClassCompatible } from 'app/utils/item-utils';
import clsx from 'clsx';
import { useMemo } from 'react';
import StoreHeading from '../character-tile/StoreHeading';
import D1ReputationSection from './D1ReputationSection';
import styles from './DesktopStores.m.scss';
import HeaderShadowDiv from './HeaderShadowDiv';
import InventoryCollapsibleTitle from './InventoryCollapsibleTitle';
import { StoreBuckets } from './StoreBuckets';
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
  const vault = getVault(stores);
  const currentStore = getCurrentStore(stores);
  const setSetting = useSetSetting();
  useEventBusListener(locateItem$, itemPop);

  // Hide the single character toggle for players with only one character
  // unless they own items that cannot be used by their only character.
  const singleCharacterHasEffect = useMemo(
    () =>
      stores.length > 2 ||
      (currentStore &&
        stores.some((s) =>
          s.items.some((i) => !isClassCompatible(i.classType, currentStore.classType)),
        )),
    [stores, currentStore],
  );

  if (!stores.length || !buckets || !vault || !currentStore) {
    return null;
  }

  let headerStores = stores;
  if (singleCharacter) {
    headerStores = [currentStore, vault];
  }

  const toggleSingleCharacter = () => setSetting('singleCharacter', !singleCharacter);

  return (
    <div className={clsx(styles.inventoryContainer, `destiny${currentStore.destinyVersion}`)}>
      <div
        className={clsx('inventory-content', {
          singleCharacter,
        })}
        role="main"
        aria-label={t('Header.Inventory')}
      >
        <HeaderShadowDiv className={clsx('store-row', 'store-header')}>
          {headerStores.map((store) => (
            <div className="store-cell" key={store.id}>
              <StoreHeading store={store} />
              <StoreStats store={store} />
            </div>
          ))}
          <div className={styles.buttons}>
            {singleCharacterHasEffect && (
              <button
                type="button"
                className={styles.singleCharacterButton}
                onClick={toggleSingleCharacter}
                title={
                  singleCharacter
                    ? t('Settings.ExpandSingleCharacter')
                    : `${t('Settings.SingleCharacter')}: ${t(
                        'Settings.SingleCharacterExplanation',
                      )}`
                }
              >
                <AppIcon icon={singleCharacter ? minimizeIcon : maximizeIcon} />
              </button>
            )}
          </div>
          {$featureFlags.issueBanner && <IssueAwarenessBanner />}
        </HeaderShadowDiv>

        <StoresInventory
          stores={headerStores}
          vault={vault}
          currentStore={currentStore}
          buckets={buckets}
          singleCharacter={singleCharacter}
          hidePostmaster={false}
        />
      </div>
      {$featureFlags.itemFeed && <ItemFeedSidebar />}
    </div>
  );
}

/** Is there any store that has an item in any of the buckets in this category? */
function categoryHasItems(
  allBuckets: InventoryBuckets,
  category: string,
  stores: DimStore[],
  currentStore: DimStore,
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
    <InventoryCollapsibleTitle
      title={t(`Bucket.${category as BucketSortType}`, { metadata: { keys: 'buckets' } })}
      sectionId={category}
      stores={stores}
    >
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

function StoresInventory(
  props: {
    hidePostmaster: boolean;
  } & InventoryContainerProps,
) {
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
