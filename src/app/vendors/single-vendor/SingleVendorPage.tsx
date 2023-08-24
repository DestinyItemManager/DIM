import { DestinyAccount } from 'app/accounts/destiny-account';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import { storesSelector } from '../../inventory/selectors';
import SingleVendor from './SingleVendor';
import styles from './SingleVendorPage.m.scss';

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
export default function SingleVendorPage({ account }: { account: DestinyAccount }) {
  const { vendorHash: vendorHashString } = useParams();
  const vendorHash = parseInt(vendorHashString ?? '', 10);
  const { search } = useLocation();
  const stores = useSelector(storesSelector);

  // TODO: get for all characters, or let people select a character? This is a hack
  // we at least need to display that character!
  const characterId =
    (search && new URLSearchParams(search).get('characterId')) ||
    (stores.length && getCurrentStore(stores)?.id);
  if (!characterId) {
    throw new Error('no characters chosen or found to use for vendor API call');
  }

  return (
    <div className={clsx(styles.page, 'dim-page')}>
      <SingleVendor
        account={account}
        vendorHash={vendorHash}
        characterId={characterId}
        updatePageTitle
      />
    </div>
  );
}
