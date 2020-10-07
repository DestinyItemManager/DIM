import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { t } from 'app/i18next-t';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimStore } from 'app/inventory/store-types';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';

export default function TriumphView({
  defs,
  stores,
  trackedTriumphs,
  profileResponse,
}: {
  defs?: D2ManifestDefinitions;
  stores: DimStore[];
  trackedTriumphs: number[];
  profileResponse?: DestinyProfileResponse;
}) {
  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  return (
    <InventoryCollapsibleTitle
      title={t('Progress.TrackedTriumphs')}
      sectionId="trackedTriumphs"
      stores={stores}
      defaultCollapsed={true}
    >
      <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
        <TrackedTriumphs
          trackedTriumphs={trackedTriumphs}
          trackedRecordHash={trackedRecordHash}
          defs={defs!}
          profileResponse={profileResponse!}
          hideRecordIcon={true}
        />
      </ErrorBoundary>
    </InventoryCollapsibleTitle>
  );
}
