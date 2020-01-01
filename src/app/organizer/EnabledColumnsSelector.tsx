import React, { ReactNode } from 'react';
import _ from 'lodash';
import DropDown, { DropDownItem } from './DropDown';
import { t } from 'app/i18next-t';

export interface ColumnStatus {
  id: string;
  content: ReactNode;
  enabled: boolean;
}

/**
 * Component for selection of which columns are displayed in the organizer table.
 * Props:
 * columns: all possible columns in the table (whether showing or not)
 * enabledColumns: a list of the column id's for the currently visible columns
 * onChangeEnabledColumn: handler for when column visibility is toggled
 *
 * TODO: Convert to including drag and drop functionality so that columns can be reordered.
 */
function EnabledColumnsSelector({
  enabledColumns,
  onChangeEnabledColumn,
  onChangeColumnOrder
}: {
  enabledColumns: ColumnStatus[];
  onChangeEnabledColumn(item: ColumnStatus): void;
  onChangeColumnOrder(columnStatus: ColumnStatus[]): void;
}) {
  const columnStatusMap = _.keyBy(enabledColumns, (col) => col.id);
  const items: DropDownItem[] = [];

  for (const column of enabledColumns) {
    const { id, content } = column;

    if (id && content) {
      items.push({
        id,
        content,
        checked: column.enabled,
        onItemSelect: () => status && onChangeEnabledColumn(column)
      });
    }
  }

  return (
    <DropDown
      buttonText={t('Organizer.EnabledColumns')}
      dropDownItems={items}
      onOrderChange={(dropDownItems: DropDownItem[]) =>
        onChangeColumnOrder(dropDownItems.map((ddi) => columnStatusMap[ddi.id]))
      }
    />
  );
}

export default EnabledColumnsSelector;
