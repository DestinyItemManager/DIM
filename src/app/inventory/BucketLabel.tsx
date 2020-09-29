import { destinyVersionSelector } from 'app/accounts/selectors';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { InventoryBucket } from './inventory-buckets';

interface StoreProps {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
  };
}

function BucketLabel({
  defs,
  bucket,
}: {
  bucket: InventoryBucket;
} & StoreProps) {
  return (
    <div className="store-cell bucket-label title">
      {defs && (
        <div>
          {defs.InventoryBucket[bucket.hash]?.displayProperties?.name ||
            defs.InventoryBucket[bucket.hash]?.title ||
            defs.InventoryBucket[bucket.hash]?.bucketName}
        </div>
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(BucketLabel);
