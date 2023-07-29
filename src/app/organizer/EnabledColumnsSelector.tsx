import { t } from 'app/i18next-t';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { memo } from 'react';
import { getColumnSelectionId } from './Columns';
import DropDown, { DropDownItem } from './DropDown';
import { ColumnDefinition } from './table-types';

/**
 * Component for selection of which columns are displayed in the organizer table.
 * Props:
 * columns: all possible columns in the table (whether showing or not)
 * enabledColumns: a list of the column id's for the currently visible columns
 * onChangeEnabledColumn: handler for when column visibility is toggled
 *
 * TODO: Convert to including drag and drop functionality so that columns can be reordered.
 */
// TODO: Save to settings
export default memo(function EnabledColumnsSelector({
  columns,
  enabledColumns,
  forClass,
  onChangeEnabledColumn,
}: {
  columns: ColumnDefinition[];
  enabledColumns: string[];
  forClass: DestinyClass;
  onChangeEnabledColumn: (item: { checked: boolean; id: string }) => void;
}) {
  const items: { [id: string]: DropDownItem } = {};

  for (const column of columns) {
    const id = getColumnSelectionId(column);
    const header = column.columnGroup ? column.columnGroup.header : column.header;
    const dropdownLabel = column.columnGroup
      ? column.columnGroup.dropdownLabel
      : column.dropdownLabel;
    if (
      id === 'selection' ||
      column.noHide ||
      (column.limitToClass !== undefined && column.limitToClass !== forClass)
    ) {
      continue;
    }

    const checked = enabledColumns.includes(id) || false;

    if (!(id in items)) {
      items[id] = {
        id,
        content: header,
        dropdownLabel: dropdownLabel,
        checked,
        onItemSelect: () => onChangeEnabledColumn({ id, checked: !checked }),
      };
    }
  }

  return (
    <DropDown
      buttonText={t('Organizer.EnabledColumns')}
      dropDownItems={Object.values(items)}
      forClass={forClass}
      right={true}
    />
  );
});
