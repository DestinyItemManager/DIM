import React from 'react';
import _ from 'lodash';
import { DimItem } from 'app/inventory/item-types';
import { Column } from 'react-table';
import DropDown, { DropDownItem } from './DropDown';
import { t } from 'app/i18next-t';

function EnabledColumnsSelector({
  columns,
  enabledColumns,
  onChangeEnabledColumn
}: {
  columns: Column<DimItem>[];
  enabledColumns: string[];
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

  return <DropDown buttonText={t('Organizer.EnabledColumns')} dropDownItems={items} />;
}

export default EnabledColumnsSelector;
