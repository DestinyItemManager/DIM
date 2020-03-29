import React from 'react';
import { itemTagSelectorList, TagValue, getTag } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { RootState, ThunkDispatchProp } from '../store/reducers';
import { t } from 'app/i18next-t';
import './ItemTagSelector.scss';
import { setItemTag } from 'app/inventory/actions';
import { itemInfosSelector } from 'app/inventory/selectors';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  tag?: TagValue;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return { tag: getTag(props.item, itemInfosSelector(state)) };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemTagSelector({ item, tag, dispatch }: Props) {
  const onTagUpdated = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tag = e.currentTarget.value as TagValue;
    dispatch(setItemTag({ itemId: item.id, tag: tag === 'clear' ? undefined : tag }));
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
