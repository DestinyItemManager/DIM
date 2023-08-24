import { useEventBusListener } from 'app/utils/hooks';
import React, { Suspense, createContext, lazy, useCallback, useState } from 'react';
import { DestinyAccount } from '../../accounts/destiny-account';
import { SingleVendorState, hideVendorSheet$ } from './single-vendor-sheet';

const SingleVendorSheet = lazy(async () => ({
  default: (await import(/* webpackChunkName: "vendors" */ 'app/vendors/components'))
    .SingleVendorSheet,
}));

export const SingleVendorSheetContext = createContext<React.Dispatch<
  React.SetStateAction<SingleVendorState>
> | null>(null);

export default function SingleVendorSheetContainer({
  account,
  children,
}: {
  account: DestinyAccount;
  children: React.ReactNode;
}) {
  const [currentVendorHash, setCurrentVendorHash] = useState<SingleVendorState>({});

  const onClose = useCallback(() => {
    setCurrentVendorHash({});
  }, []);

  useEventBusListener(
    hideVendorSheet$,
    useCallback(() => {
      setCurrentVendorHash({});
    }, [])
  );

  return (
    <>
      <SingleVendorSheetContext.Provider value={setCurrentVendorHash}>
        {children}
      </SingleVendorSheetContext.Provider>
      <Suspense fallback={null}>
        {currentVendorHash.characterId && currentVendorHash.vendorHash !== undefined && (
          <SingleVendorSheetContainer account={account}>
            <SingleVendorSheet
              account={account}
              characterId={currentVendorHash.characterId}
              vendorHash={currentVendorHash.vendorHash}
              onClose={onClose}
            />
          </SingleVendorSheetContainer>
        )}
      </Suspense>
    </>
  );
}
