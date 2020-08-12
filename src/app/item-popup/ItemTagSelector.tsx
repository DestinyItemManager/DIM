import React from 'react';
import { itemTagSelectorList, TagValue, getTag } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { t } from 'app/i18next-t';
import './ItemTagSelector.scss';
import { setItemTag, setItemHashTag } from 'app/inventory/actions';
import { itemInfosSelector, itemHashTagsSelector } from 'app/inventory/selectors';
import { itemIsInstanced } from 'app/utils/item-utils';

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
