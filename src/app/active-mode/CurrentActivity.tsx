import { DestinyAccount } from 'app/accounts/destiny-account';
import { getCurrentActivity } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { ghostBadgeContent } from 'app/inventory/BadgeInfo';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import StoreInventoryItem from 'app/inventory/StoreInventoryItem';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorsState } from 'app/vendors/reducer';
import { VendorItem } from 'app/vendors/vendor-item';
import VendorItemComponent from 'app/vendors/VendorItemComponent';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useEffect, useState } from 'react';

const enum Destinations {
  DreamingCity = 2877881518,
  EDZ = 3747705955,
  IO = 4251857532,
  Mars = 2426873752,
  Mercury = 1259908504,
  Moon = 3325508439,
  Nessus = 3526908984,
  TangledShore = 975684424,
  Titan = 386951460,
  Tower = 0,
}

const enum Vendors {
  AnaBray = 0,
  AsherMir = 0,
  Banshee = 0,
  BrotherVance = 0,
  DevrimKay = 396892126,
  Drifter = 0,
  ErisMorn = 1616085565,
  EvaLevante = 0,
  FailSafe = 0,
  Hawthorne = 0,
  Petra = 0,
  Saint14 = 0,
  LordSaladin = 0,
  Shaxx = 0,
  Sloane = 0,
  Spider = 0,
  Zavala = 0,
}

const enum ActivityType {
  Crucible = 2,
  Gambit = 4,
  Leviathan = 3,
  Strikes = 1,
  IronBanner = 0,
  Trials = 9,
}

// keys are based on data/d2/ghost-perks.json
const ghostTypeToPlaceHash = {
  dreaming: Destinations.DreamingCity,
  edz: Destinations.EDZ,
  io: Destinations.IO,
  mars: Destinations.Mars,
  mercury: Destinations.Mercury,
  moon: Destinations.Moon,
  nessus: Destinations.Nessus,
  tangled: Destinations.TangledShore,
  titan: Destinations.Titan,
};

const ghostTypeToActivityHash = {
  crucible: ActivityType.Crucible,
  gambit: ActivityType.Gambit,
  leviathan: ActivityType.Leviathan,
  strikes: ActivityType.Strikes,
};

const vendorsByActivityHash = {
  [ActivityType.Crucible]: [Vendors.Shaxx],
  [ActivityType.IronBanner]: [Vendors.LordSaladin, Vendors.Shaxx],
  [ActivityType.Trials]: [Vendors.Saint14, Vendors.Shaxx],
  [ActivityType.Gambit]: [Vendors.Drifter],
  [ActivityType.Leviathan]: [Vendors.Hawthorne],
  [ActivityType.Strikes]: [Vendors.Zavala],
};

const vendorsByDestinationHash = {
  [Destinations.Tower]: [Vendors.EvaLevante, Vendors.Banshee],
  [Destinations.DreamingCity]: [Vendors.Petra],
  [Destinations.EDZ]: [Vendors.DevrimKay],
  [Destinations.IO]: [Vendors.AsherMir],
  [Destinations.Mars]: [Vendors.AnaBray],
  [Destinations.Mercury]: [Vendors.BrotherVance],
  [Destinations.Moon]: [Vendors.ErisMorn],
  [Destinations.Nessus]: [Vendors.FailSafe],
  [Destinations.TangledShore]: [Vendors.Spider],
  [Destinations.Titan]: [Vendors.Sloane],
};

async function refreshActivity({ account, storeId }: { account: DestinyAccount; storeId: string }) {
  const profileInfo = await getCurrentActivity(account);
  return profileInfo.characterActivities.data?.[storeId].currentActivityHash;
}

export default function CurrentActivity({
  defs,
  account,
  buckets,
  vendors,
  store,
}: {
  defs?: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  account: DestinyAccount;
  vendors?: VendorsState['vendorsByCharacter'];
  store: DimStore;
}) {
  const [hash, setHash] = useState<number | undefined>();
  useEffect(() => {
    refreshActivity({ account, storeId: store.id }).then(setHash);
  }, [defs, account, store]);

  if (!defs || !hash) {
    return null;
  }

  const bounties: VendorItem[] = [];
  if (vendors) {
    const vendorData = store.id ? vendors[store.id] : undefined;
    const vendorsResponse = vendorData?.vendorsResponse;

    const activity = defs.Activity.get(hash);
    const vendorHashes =
      vendorsByActivityHash[activity.placeHash] || vendorsByDestinationHash[activity.placeHash];

    vendorHashes.forEach((vendorHash) => {
      const vendor = vendorsResponse?.vendors.data?.[vendorHash];

      const d2Vendor = toVendor(
        vendorHash,
        defs,
        buckets,
        vendor,
        account,
        vendorsResponse?.itemComponents[vendorHash],
        vendorsResponse?.sales.data?.[vendorHash]?.saleItems,
        {}
      );

      const things = d2Vendor?.items.filter(({ item }: VendorItem) =>
        item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties)
      );

      if (things) {
        bounties.push(...things);
      }
    });
  }

  const activity = defs.Activity.get(hash);

  if (!activity) {
    return null;
  }

  const location = `${activity.displayProperties.name}`;
  const activityType = defs.ActivityMode[activity.activityTypeHash];

  let gameType;
  let isGhostActivity;
  if (activityType) {
    gameType = activityType.displayProperties.name;
    isGhostActivity = [1, 2, 3].includes(activityType.hash);
  }

  const possibleGhosts: DimItem[] = store.items.filter((item) => {
    if (item.bucket.hash !== BucketHashes.Ghost) {
      return;
    }

    const [planetName] = ghostBadgeContent(item);

    if (isGhostActivity) {
      return ghostTypeToActivityHash[planetName] === activity.activityTypeHash;
    } else {
      return ghostTypeToPlaceHash[planetName] === activity.placeHash;
    }
  });

  return (
    <InventoryCollapsibleTitle
      title={'Current Activity'}
      sectionId={'Activity'}
      stores={[store]}
      defaultCollapsed={true}
    >
      <div className="current-location">
        {location}
        <div className="current-acivity">
          {gameType}
          <BungieImage src={activity.displayProperties.icon} />
        </div>
      </div>
      <div className="activity-items">
        {possibleGhosts.map((item) => (
          <StoreInventoryItem key={item.id} item={item} />
        ))}
        {bounties?.map((item) => (
          <VendorItemComponent
            key={item.key}
            defs={defs}
            item={item}
            owned={false}
            characterId={store.id}
          />
        ))}
      </div>
    </InventoryCollapsibleTitle>
  );
}
