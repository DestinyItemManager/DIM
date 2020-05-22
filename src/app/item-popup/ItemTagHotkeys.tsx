import React from 'react';
import { itemTagList, TagValue, getTag } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { setItemTag } from '../inventory/actions';
import { Hotkey } from '../hotkeys/hotkeys';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { itemInfosSelector } from 'app/inventory/selectors';

interface ProvidedProps {
  item: DimItem;
  children: React.ReactNode;
}

interface StoreProps {
  itemTag: TagValue | undefined;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    itemTag: getTag(props.item, itemInfosSelector(state)),
  };
}

const mapDispatchToProps = {
  setItemTag,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

function ItemTagHotkeys({ item, children, itemTag, setItemTag }: Props) {
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
          setItemTag({ itemId: item.id, tag: itemTag === tag.type ? undefined : tag.type }),
      });
    }
  });

  return (
    <GlobalHotkeys key={item.id} hotkeys={hotkeys}>
      {children}
    </GlobalHotkeys>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemTagHotkeys);
