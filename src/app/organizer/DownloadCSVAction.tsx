import { t, tl } from 'app/i18next-t';
import { downloadCsvFiles } from 'app/inventory/spreadsheets';
import { AppIcon, spreadsheetIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { ItemCategoryTreeNode } from './ItemTypeSelector';

const downloadButtonSettings = [
  { categoryId: ['weapons'], csvType: 'weapon' as const, label: tl('Bucket.Weapons') },
  {
    categoryId: ['hunter', 'titan', 'warlock'],
    csvType: 'armor' as const,
    label: tl('Bucket.Armor'),
  },
  { categoryId: ['ghosts'], csvType: 'ghost' as const, label: tl('Bucket.Ghost') },
];

export default function DownloadCSVAction({
  firstCategory,
  className,
}: {
  firstCategory: ItemCategoryTreeNode;
  className?: string;
}) {
  const dispatch = useThunkDispatch();
  const downloadButtonSetting = downloadButtonSettings.find((setting) =>
    setting.categoryId.includes(firstCategory.id),
  );
  if (downloadButtonSetting) {
    const downloadHandler = (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(downloadCsvFiles(downloadButtonSetting.csvType));
      return false;
    };

    return (
      <button type="button" className={clsx(className, 'dim-button')} onClick={downloadHandler}>
        <AppIcon icon={spreadsheetIcon} /> <span>{t(downloadButtonSetting.label)}.csv</span>
      </button>
    );
  }

  return null;
}
