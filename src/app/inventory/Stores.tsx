import { RootState } from 'app/store/types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import DesktopStores from './DesktopStores';
import { InventoryBuckets } from './inventory-buckets';
import PhoneStores from './PhoneStores';
import { bucketsSelector, sortedStoresSelector } from './selectors';
import { DimStore } from './store-types';
import './Stores.scss';

interface StoreProps {
  stores: DimStore[];
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: sortedStoresSelector(state),
    buckets: bucketsSelector(state)!,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

type Props = StoreProps;

/**
 * Display inventory and character headers for all characters and the vault.
 */
function Stores(this: void, { stores, buckets, isPhonePortrait }: Props) {
  useEffect(() => {
    setTimeout(() => {
      /* Set a CSS variable so we can style things based on the height of the header */
      const element = document.querySelector('.store-header');
      if (element) {
        document
          .querySelector('html')!
          .style.setProperty('--store-header-height', element.clientHeight + 'px');
      }
    }, 0);
  });

  if (!stores.length || !buckets) {
    return null;
  }

  return isPhonePortrait ? (
    <PhoneStores stores={stores} buckets={buckets} />
  ) : (
    <DesktopStores stores={stores} buckets={buckets} />
  );
}

export default connect<StoreProps>(mapStateToProps)(Stores);
