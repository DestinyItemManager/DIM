import React, { useState, ReactNode } from 'react';
import styles from './DropDown.m.scss';
import { AppIcon, moveDownIcon, enabledIcon, unselectedCheckIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
  onItemSelect?(e: any): void;
}

function MenuItem({ item, forClass }: { item: DropDownItem; forClass?: DestinyClass }) {
  return (
    <div key={item.id} className={`check-button ${styles.checkButton}`} onClick={item.onItemSelect}>
      <label>
        {item.id === 'customstat' ? (
          <>
            Custom Total
            <StatTotalToggle forClass={forClass} />
          </>
        ) : (
          item.content
        )}
      </label>
      {item.checked !== undefined && (
        <AppIcon icon={item.checked ? enabledIcon : unselectedCheckIcon} />
      )}
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
        {buttonText} <AppIcon icon={moveDownIcon} />
      </button>
      <div className={clsx(styles.menu, { [styles.right]: right })}>
        {dropdownOpen &&
          dropDownItems.map((item) => <MenuItem key={item.id} item={item} forClass={forClass} />)}
      </div>
    </ClickOutside>
  );
}

export default DropDown;
