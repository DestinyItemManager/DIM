import React from 'react';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';

interface DestinyAccountContext {
  account: DestinyAccount;
  manifest: D2ManifestDefinitions | D1ManifestDefinitions;
}

export const AccountContext = React.createContext<DestinyAccountContext>(
  // Yes this is bad, but we don't have a value here. Anything that uses this will have it provided.
  null as any
);
