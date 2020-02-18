import React from 'react';
import { itemTagSelectorList, TagValue, getTag } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import { t } from 'app/i18next-t';
import './ItemTagSelector.scss';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  tag?: TagValue;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return { tag: getTag(props.item, state.inventory.itemInfos) };
}

type Props = ProvidedProps & StoreProps;

function ItemTagSelector(this: void, { item, tag }: Props) {
  const setTag = (tag?: TagValue | 'none') => {
    const info = item.dimInfo;
    if (info) {
      if (tag && tag !== 'none') {
        info.tag = tag;
      } else {
        delete info.tag;
      }
      info.save!();
    }
  };
  const onTagUpdated = (e) => {
    const tag = e.currentTarget.value as TagValue;
    setTag(tag);
  };

  return (
    <select className="item-tag-selector" onChange={onTagUpdated} value={tag || 'none'}>
      {itemTagSelectorList.map((tagOption) => (
        <option key={tagOption.type || 'reset'} value={tagOption.type || 'none'}>
          {t(tagOption.label)}
        </option>
      ))}
    </select>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemTagSelector);
