import { itemTagList, TagValue, getTag } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { setItemTag, setItemHashTag } from '../inventory/actions';
import { Hotkey } from '../hotkeys/hotkeys';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { itemInfosSelector, itemHashTagsSelector } from 'app/inventory/selectors';
import { itemIsInstanced } from 'app/utils/item-utils';
import { emptyArray } from 'app/utils/empty';
import { useHotkeys } from 'app/hotkeys/useHotkey';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  itemTag: TagValue | undefined;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    itemTag: getTag(props.item, itemInfosSelector(state), itemHashTagsSelector(state)),
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemTagHotkeys({ item, itemTag, dispatch }: Props) {
  let hotkeys: Hotkey[] = emptyArray<Hotkey>();
  if (item.taggable) {
    hotkeys = [];

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

export default connect<StoreProps>(mapStateToProps)(ItemTagHotkeys);
