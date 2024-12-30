import { currentAccountSelector } from 'app/accounts/selectors';
import { useEventBusListener } from 'app/utils/hooks';
import React, { Suspense, createContext, lazy, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { SingleVendorState, hideVendorSheet$ } from './single-vendor-sheet';

const SingleVendorSheet = lazy(
  async () =>
    import(/* webpackChunkName: "vendors" */ 'app/vendors/single-vendor/SingleVendorSheet'),
);

export const SingleVendorSheetContext = createContext<React.Dispatch<
  React.SetStateAction<SingleVendorState>
> | null>(null);

export default function SingleVendorSheetContainer({ children }: { children: React.ReactNode }) {
  const account = useSelector(currentAccountSelector);
  const [currentVendorHash, setCurrentVendorHash] = useState<SingleVendorState>({});

  const onClose = useCallback(() => {
    setCurrentVendorHash({});
  }, []);

  useEventBusListener(
    hideVendorSheet$,
    useCallback(() => {
      setCurrentVendorHash({});
    }, []),
  );

  return (
    <>
      <SingleVendorSheetContext value={setCurrentVendorHash}>
        {children}
        <Suspense fallback={null}>
          {account &&
            currentVendorHash.characterId &&
            currentVendorHash.vendorHash !== undefined && (
              <SingleVendorSheet
                account={account}
                characterId={currentVendorHash.characterId}
                vendorHash={currentVendorHash.vendorHash}
                onClose={onClose}
              />
            )}
        </Suspense>
      </SingleVendorSheetContext>
    </>
  );
}
