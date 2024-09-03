import ClickOutside from 'app/dim-ui/ClickOutside';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { t } from 'app/i18next-t';
import { AppIcon, enabledIcon, expandDownIcon, unselectedCheckIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { ReactNode, useState } from 'react';
import styles from './DropDown.m.scss';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  dropdownLabel?: ReactNode;
  checked?: boolean;
  onItemSelect?: (e: React.MouseEvent) => void;
}

function MenuItem({ item, forClass }: { item: DropDownItem; forClass?: DestinyClass }) {
  return (
    <div key={item.id} className={`check-button ${styles.checkButton}`} onClick={item.onItemSelect}>
      {item.checked !== undefined && (
        <AppIcon icon={item.checked ? enabledIcon : unselectedCheckIcon} />
      )}
      <label>
        {item.dropdownLabel ?? item.dropdownLabel}
        {item.id === 'customstat' ? (
          <>
            {t('Organizer.Columns.CustomTotal')}
            <StatTotalToggle forClass={forClass} />
          </>
        ) : (
          item.content
        )}
      </label>
    </div>
  );
}

function DropDown({
  buttonText,
  buttonDisabled,
  dropDownItems,
  forClass,
  right,
}: {
  buttonText: ReactNode;
  buttonDisabled?: boolean;
  dropDownItems: DropDownItem[];
  forClass?: DestinyClass;
  /** Is this right-aligned? */
  right?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <ClickOutside onClickOutside={() => setDropdownOpen(false)} className={styles.dropDown}>
      <button
        type="button"
        className={`dim-button ${styles.button}`}
        disabled={buttonDisabled}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {buttonText} <AppIcon icon={expandDownIcon} />
      </button>
      <div className={clsx(styles.menu, { [styles.right]: right })}>
        {dropdownOpen &&
          dropDownItems.map((item) => <MenuItem key={item.id} item={item} forClass={forClass} />)}
      </div>
    </ClickOutside>
  );
}

export default DropDown;
