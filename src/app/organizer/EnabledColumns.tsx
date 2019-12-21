import React, { useState } from 'react';
import _ from 'lodash';
import styles from './EnabledColumns.m.scss';
import { DimItem } from 'app/inventory/item-types';
import { Column } from 'react-table';
import { AppIcon, openDropdownIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';

function EnabledColumns({
  columns,
  enabledColumns,
  onChangeEnabledColumn
}: {
  columns: Column<DimItem>[];
  enabledColumns: string[];
  onChangeEnabledColumn: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={styles.enabledColumns}>
      <ClickOutside onClickOutside={() => setDropdownOpen(false)}>
        <div
          className={`dim-button ${styles.enabledColumnsButton}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          Enabled Columns <AppIcon icon={openDropdownIcon} />
        </div>
        <div className={styles.enabledColumnsDropDown}>
          {dropdownOpen &&
            columns.map(
              (c) =>
                c.id !== 'selection' && (
                  <label key={c.id} className={`check-button ${styles.enabledColumnsCheckButton}`}>
                    <input
                      name={c.id}
                      type="checkbox"
                      checked={enabledColumns.includes(c.id!)}
                      onChange={onChangeEnabledColumn}
                    />{' '}
                    {_.isFunction(c.Header) ? c.Header({} as any) : c.Header}
                  </label>
                )
            )}
        </div>
      </ClickOutside>
    </div>
  );
}

export default EnabledColumns;
