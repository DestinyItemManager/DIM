import React from 'react';
import _ from 'lodash';
import { DimItem } from 'app/inventory/item-types';
import { Column } from 'react-table';
import DropDown, { DropDownItem } from './DropDown';

function EnabledColumnsSelector({
  columns,
  enabledColumns,
  onChangeEnabledColumn
}: {
  columns: Column<DimItem>[];
  enabledColumns: string[];
  onChangeEnabledColumn(item: DropDownItem): void;
}) {
  const items: DropDownItem[] = [];

  for (const column of columns) {
    const { id, Header } = column;
    const content = _.isFunction(Header) ? Header({} as any) : Header;
    const checked = enabledColumns.includes(id!) || false;

    if (id && content) {
      items.push({ id, content, checked, onItemSelect: onChangeEnabledColumn });
    }
  }

  return <DropDown buttonText="EnabledItems" dropDownItems={items} />;
}

export default EnabledColumnsSelector;
