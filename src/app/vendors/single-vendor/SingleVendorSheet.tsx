import { DestinyAccount } from 'app/accounts/destiny-account';
import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import SingleVendor from './SingleVendor';
import styles from './SingleVendorSheet.m.scss';

export default function SingleVendorSheet({
  account,
  characterId,
  vendorHash,
  onClose,
}: {
  account: DestinyAccount;
  characterId: string;
  vendorHash: number;
  onClose: () => void;
}) {
  return (
    <Sheet key={vendorHash} onClose={onClose} sheetClassName={styles.vendorSheet} allowClickThrough>
      <ClickOutsideRoot>
        <div className={styles.sheetContents}>
          <SingleVendor account={account} characterId={characterId} vendorHash={vendorHash} />
        </div>
      </ClickOutsideRoot>
    </Sheet>
  );
}
