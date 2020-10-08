import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { t } from 'app/i18next-t';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';

// This is currently un-used in favor of the PursuitsView.tsx
export default function TriumphView({
  defs,
  trackedTriumphs,
  profileResponse,
}: {
  defs?: D2ManifestDefinitions;
  trackedTriumphs: number[];
  profileResponse?: DestinyProfileResponse;
}) {
  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  return (
    <CollapsibleTitle
      title={t('Progress.TrackedTriumphs')}
      sectionId="active-triumphs"
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
    </CollapsibleTitle>
  );
}
