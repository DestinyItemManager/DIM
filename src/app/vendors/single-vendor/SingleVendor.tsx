import { DestinyAccount } from 'app/accounts/destiny-account';
import Countdown from 'app/dim-ui/Countdown';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import {
  bucketsSelector,
  createItemContextSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useD2Definitions } from 'app/manifest/selectors';
import ErrorPanel from 'app/shell/ErrorPanel';
import { usePageTitle } from 'app/utils/hooks';
import { useSelector } from 'react-redux';
import { VendorLocation } from '../Vendor';
import VendorItems from '../VendorItems';
import { D2Vendor, toVendor } from '../d2-vendors';
import { useLoadVendors } from '../hooks';
import {
  ownedVendorItemsSelector,
  vendorItemFilterSelector,
  vendorsByCharacterSelector,
} from '../selectors';
import ArtifactUnlocks from './ArtifactUnlocks';
import styles from './SingleVendor.m.scss';

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
export default function SingleVendor({
  account,
  vendorHash,
  characterId,
  updatePageTitle,
}: {
  account: DestinyAccount;
  vendorHash: number;
  characterId: string;
  updatePageTitle?: boolean;
}) {
  const buckets = useSelector(bucketsSelector);
  const profileResponse = useSelector(profileResponseSelector);
  const vendors = useSelector(vendorsByCharacterSelector);
  const defs = useD2Definitions();
  const itemCreationContext = useSelector(createItemContextSelector);

  const ownedItemHashes = useSelector(ownedVendorItemsSelector(characterId));

  const vendorData = characterId ? vendors[characterId] : undefined;
  const vendorResponse = vendorData?.vendorsResponse;

  const vendorDef = defs?.Vendor.get(vendorHash);
  const returnWithVendorRequest = vendorDef?.returnWithVendorRequest;
  useLoadStores(account);
  useLoadVendors(account, characterId, /* active */ returnWithVendorRequest);
  const replacer = useDynamicStringReplacer(characterId);
  usePageTitle(
    replacer(vendorDef?.displayProperties.name) ?? t('Vendors.Vendors'),
    updatePageTitle ?? false,
  );

  const itemFilter = useSelector(vendorItemFilterSelector(characterId));

  if (!defs || !buckets) {
    return <ShowPageLoading message={t('Manifest.Load')} />;
  }

  if (!vendorDef) {
    return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
  }

  if (vendorData?.error) {
    return <ErrorPanel error={vendorData.error} />;
  }
  if (vendorDef.returnWithVendorRequest) {
    if (!profileResponse) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }
    if (!vendorResponse) {
      return <ShowPageLoading message={t('Loading.Vendors')} />;
    }
  }

  // TODO:
  // * featured item
  // * enabled
  // * filter by character class
  // * load all classes?
  const vendor = vendorResponse?.vendors.data?.[vendorHash];

  const destinationDef =
    vendor?.vendorLocationIndex && vendorDef.locations[vendor.vendorLocationIndex]
      ? defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash)
      : undefined;
  const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

  const placeString = [destinationDef?.displayProperties.name, placeDef?.displayProperties.name]
    .filter((n) => n?.length)
    .join(', ');
  // TODO: there's a cool background image but I'm not sure how to use it

  let displayName = vendorDef.displayProperties.name;
  let displayDesc = vendorDef.displayProperties.description;
  let isArtifact = false;

  // if this vendor is the seasonal artifact
  if (vendorDef.displayCategories.find((c) => c.identifier === 'category_reset')) {
    // search for the associated item. this is way harder than it should be, but we have what we are given
    const seasonHash = profileResponse?.profile.data?.currentSeasonHash;
    const artifactDisplay = Object.values(defs.InventoryItem.getAll()).find(
      (i) =>
        // belongs to the current season,                         and looks like an artifact
        i.seasonHash === seasonHash && /\.artifacts?\./.test(i.inventory!.stackUniqueLabel ?? ''),
    )?.displayProperties;
    if (artifactDisplay) {
      displayName = artifactDisplay.name;
      displayDesc = artifactDisplay.description;
      isArtifact = true;
    }
  }

  // The artifact vendor isn't returned by Bungie.net, contains too
  // many artifact mods, and doesn't allow us to figure out what's unlocked
  // and what isn't, so we instead use <ArtifactUnlocks />, based on the character
  // progression. For all the normal vendors we use the vendor items.
  let d2Vendor: D2Vendor | undefined;
  let refreshTime: Date | undefined;
  if (!isArtifact) {
    d2Vendor = toVendor(
      { ...itemCreationContext, itemComponents: vendorResponse?.itemComponents?.[vendorHash] },
      vendorHash,
      vendor,
      characterId,
      vendorResponse?.sales.data?.[vendorHash]?.saleItems,
      vendorResponse,
    );
    if (!d2Vendor) {
      return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
    }
    d2Vendor = { ...d2Vendor, items: d2Vendor.items.filter((i) => itemFilter(i, d2Vendor!)) };
    refreshTime = d2Vendor.component && new Date(d2Vendor.component.nextRefreshDate);
    if (refreshTime?.getFullYear() === 9999) {
      refreshTime = undefined;
    }
  }

  return (
    <ErrorBoundary name="SingleVendor">
      <div className={styles.featuredHeader}>
        <h1>
          {displayName} <VendorLocation>{placeString}</VendorLocation>
        </h1>
        <div>{displayDesc}</div>
        {refreshTime && (
          <div>
            {t('Vendors.RefreshTime')} <Countdown endTime={refreshTime} />
          </div>
        )}
      </div>
      {isArtifact ? (
        <ArtifactUnlocks characterId={characterId} />
      ) : (
        <VendorItems
          vendor={d2Vendor!}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={vendorResponse?.currencyLookups.data?.itemQuantities ?? {}}
          characterId={characterId}
        />
      )}
    </ErrorBoundary>
  );
}
