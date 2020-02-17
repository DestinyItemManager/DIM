import React from 'react';
import _ from 'lodash';
import { DimItem } from 'app/inventory/item-types';
import { Column } from 'react-table';
import DropDown, { DropDownItem } from './DropDown';
import { t } from 'app/i18next-t';
import { DestinyClass } from 'bungie-api-ts/destiny2';

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
  columns,
  enabledColumns,
  forClass,
  onChangeEnabledColumn
}: {
  columns: Column<DimItem>[];
  enabledColumns: string[];
  forClass: DestinyClass;
  onChangeEnabledColumn(item: { checked: boolean; id: string }): void;
}) {
  const items: DropDownItem[] = [];

  for (const column of columns) {
    const { id, Header } = column;
    const content = _.isFunction(Header) ? Header({} as any) : Header;
    const checked = enabledColumns.includes(id!) || false;

    if (id && content) {
      items.push({
        id,
        content,
        checked,
        onItemSelect: () => onChangeEnabledColumn({ id, checked: !checked })
      });
    }
  }

  return (
    <DropDown
      buttonText={t('Organizer.EnabledColumns')}
      dropDownItems={items}
      forClass={forClass}
    />
  );
}

export default EnabledColumnsSelector;
