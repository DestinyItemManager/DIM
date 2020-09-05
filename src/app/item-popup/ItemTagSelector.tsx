import { t } from 'app/i18next-t';
import { setItemHashTag, setItemTag } from 'app/inventory/actions';
import { itemHashTagsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { itemIsInstanced } from 'app/utils/item-utils';
import React from 'react';
import { connect } from 'react-redux';
import { getTag, itemTagSelectorList, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import './ItemTagSelector.scss';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  tag?: TagValue;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return { tag: getTag(props.item, itemInfosSelector(state), itemHashTagsSelector(state)) };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemTagSelector({ item, tag, dispatch }: Props) {
  const onTagUpdated = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tag = e.currentTarget.value as TagValue;
    dispatch(
      itemIsInstanced(item)
        ? setItemTag({ itemId: item.id, tag: tag === 'clear' ? undefined : tag })
        : setItemHashTag({ itemHash: item.hash, tag: tag === 'clear' ? undefined : tag })
    );
  };

  return (
    <select className="item-tag-selector" onChange={onTagUpdated} value={tag || 'none'}>
      {itemTagSelectorList.map((tagOption) => (
        <option key={tagOption.type || 'clear'} value={tagOption.type || 'clear'}>
          {t(tagOption.label)}
        </option>
      ))}
    </select>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemTagSelector);
