import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { tagSelector } from 'app/inventory/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptyArray } from 'app/utils/empty';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hotkey } from '../hotkeys/hotkeys';
import { setTag } from '../inventory/actions';
import { itemTagList } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';

interface Props {
  item: DimItem;
}

export default function ItemTagHotkeys({ item }: Props) {
  const dispatch = useThunkDispatch();
  const itemTag = useSelector(tagSelector(item));
  const hotkeys = useMemo(() => {
    let hotkeys = emptyArray<Hotkey>();
    if (item.taggable) {
      hotkeys = [
        {
          combo: 'shift+0',
          description: t('Tags.ClearTag'),
          callback: () => dispatch(setTag(item, 'clear')),
        },
      ];

      for (const tag of itemTagList) {
        if (tag.hotkey) {
          hotkeys.push({
            combo: tag.hotkey,
            description: t('Hotkey.MarkItemAs', { tag: tag.type! }),
            callback: () => dispatch(setTag(item, itemTag === tag.type ? 'clear' : tag.type)),
          });
        }
      }
    }
    return hotkeys;
  }, [dispatch, item, itemTag]);

  useHotkeys(hotkeys);
  return null;
}
