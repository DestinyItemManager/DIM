import React from 'react';
import { itemTagList, TagValue, getTag } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { setItemTag, setItemHashTag } from '../inventory/actions';
import { Hotkey } from '../hotkeys/hotkeys';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { itemInfosSelector, itemHashTagsSelector } from 'app/inventory/selectors';
import { itemIsInstanced } from 'app/utils/item-utils';

interface ProvidedProps {
  item: DimItem;
  children: React.ReactNode;
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

function ItemTagHotkeys({ item, children, itemTag, dispatch }: Props) {
  if (!item.taggable) {
    return <>{children}</>;
  }

  const hotkeys: Hotkey[] = [];

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

  return (
    <GlobalHotkeys key={item.id} hotkeys={hotkeys}>
      {children}
    </GlobalHotkeys>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemTagHotkeys);
