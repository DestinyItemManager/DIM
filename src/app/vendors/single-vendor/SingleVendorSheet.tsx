import { DestinyAccount } from 'app/accounts/destiny-account';
import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useState } from 'react';
import SingleVendor from './SingleVendor';
import styles from './SingleVendorSheet.m.scss';
import { SingleVendorState, showSingleVendor$ } from './single-vendor-sheet';

export default function VendorSheet({ account }: { account: DestinyAccount }) {
  const [currentVendorHash, setCurrentVendorHash] = useState<SingleVendorState>({});

  const onClose = () =>
    setCurrentVendorHash((currentState) => ({ ...currentState, vendorHash: undefined }));

  useEventBusListener(
    showSingleVendor$,
    useCallback((newOptions) => {
      setCurrentVendorHash((currentState) => ({ ...currentState, ...newOptions }));
    }, [])
  );

  if (!currentVendorHash.characterId || !currentVendorHash.vendorHash) {
    return null;
  }

  return (
    <Sheet onClose={onClose} sheetClassName={styles.vendorSheet}>
      <ClickOutsideRoot>
        <div className={styles.sheetContents}>
          <SingleVendor
            account={account}
            characterId={currentVendorHash.characterId}
            vendorHash={currentVendorHash.vendorHash}
          />
        </div>
      </ClickOutsideRoot>
    </Sheet>
  );
}
