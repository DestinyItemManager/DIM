import { Hotkey } from 'app/hotkeys/hotkeys';
import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { setItemHashTag, setItemTag } from 'app/inventory/actions';
import { itemTagList } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { tagSelector } from 'app/inventory/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptyArray } from 'app/utils/empty';
import { itemIsInstanced } from 'app/utils/item-utils';
import { useSelector } from 'react-redux';

interface Props {
  item: DimItem;
}

export default function ItemTagHotkeys({ item }: Props) {
  const dispatch = useThunkDispatch();
  const itemTag = useSelector(tagSelector(item));
  let hotkeys: Hotkey[] = emptyArray<Hotkey>();
  if (item.taggable) {
    hotkeys = [
      {
        combo: 'shift+0',
        description: t('Tags.ClearTag'),
        callback: () =>
          dispatch(
            itemIsInstanced(item)
              ? setItemTag({ itemId: item.id, tag: undefined })
              : setItemHashTag({
                  itemHash: item.hash,
                  tag: undefined,
                })
          ),
      },
    ];

    itemTagList.forEach((tag) => {
      if (tag.hotkey) {
        hotkeys.push({
          combo: tag.hotkey,
          description: t('Hotkey.MarkItemAs', { tag: tag.type }),
          callback: () =>
            dispatch(
              itemIsInstanced(item)
                ? setItemTag({ itemId: item.id, tag: itemTag === tag.type ? undefined : tag.type })
                : setItemHashTag({
                    itemHash: item.hash,
                    tag: itemTag === tag.type ? undefined : tag.type,
                  })
            ),
        });
      }
    });
  }

  useHotkeys(hotkeys);
  return null;
}
