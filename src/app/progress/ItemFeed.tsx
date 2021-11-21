import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import ClassIcon from 'app/dim-ui/ClassIcon';
import PressTip from 'app/dim-ui/PressTip';
import { setItemTag } from 'app/inventory/actions';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { getTag, tagConfig, TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { useSetting } from 'app/settings/hooks';
import { acquisitionRecencyComparator } from 'app/shell/filters';
import { AppIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getWeaponArchetype } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './ItemFeed.m.scss';

export default function ItemFeed() {
  const allItems = useSelector(allItemsSelector);
  const itemInfos = useSelector(itemInfosSelector);
  const [hideTagged, setHideTagged] = useSetting('itemFeedHideTagged');

  const items = allItems
    .filter(
      (i) => i.equipment && i.power > 0 && i.taggable && (!hideTagged || !getTag(i, itemInfos))
    )
    .sort(acquisitionRecencyComparator);

  return (
    <div className={styles.sideTray}>
      <h2>Item Feed</h2>
      <CheckButton name="hideTagged" checked={hideTagged} onChange={setHideTagged}>
        Hide Tagged
      </CheckButton>
      <AnimatePresence>
        {_.take(items, 25).map((item) => (
          <Item key={item.index} item={item} tag={getTag(item, itemInfos)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Item({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  return (
    <motion.div
      className={styles.item}
      layout
      initial={{ scale: 0 }}
      exit={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />}
      </ItemPopupTrigger>
      <div className={styles.info}>
        <div className={styles.title}>
          {item.name}
          {item.classType !== DestinyClass.Unknown && (
            <ClassIcon classType={item.classType} className={styles.classIcon} />
          )}
        </div>
        <Highlights item={item} />
        <TagButtons item={item} tag={tag} />
      </div>
    </motion.div>
  );
}

function Highlights({ item }: { item: DimItem }) {
  if (item.bucket.sort === 'Weapons' && item.sockets) {
    const perkSockets = item.sockets.allSockets.filter((s) => s.isPerk && !isKillTrackerSocket(s));
    const archetype = getWeaponArchetype(item)?.displayProperties.name;

    return (
      <div>
        <span className={styles.type}>
          <ItemTypeName item={item} />
          {archetype && <span>{archetype}</span>}
        </span>
        {_.takeRight(perkSockets, 2)
          .flatMap((s) => s.plugOptions)
          .map((p) => (
            <div key={p.plugDef.hash}>
              <PressTip tooltip={<PlugTooltip item={item} plug={p} />}>
                <DefItemIcon itemDef={p.plugDef} borderless={true} />
              </PressTip>
            </div>
          ))}
      </div>
    );
  } else if (item.bucket.sort === 'Armor') {
    return (
      <div>
        {item.stats?.map((stat) => (
          <div key={stat.statHash}>
            {stat.displayProperties.hasIcon ? (
              <span title={stat.displayProperties.name}>
                <BungieImage src={stat.displayProperties.icon} />
              </span>
            ) : (
              stat.displayProperties.name
            )}
            : {stat.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function TagButtons({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  const dispatch = useThunkDispatch();
  const tagOptions = _.sortBy(
    Object.values(tagConfig).filter((t) => t.type !== 'archive'),
    (t) => t.sortOrder
  );

  const setTag = (tag: TagValue) => {
    dispatch(
      setItemTag({
        itemId: item.id,
        tag,
      })
    );
  };

  return (
    <div>
      {tagOptions.map((tagOption) => (
        <button
          key={tagOption.type}
          type="button"
          disabled={tagOption.type === tag}
          onClick={() => setTag(tagOption.type)}
        >
          <AppIcon icon={tagOption.icon} />
        </button>
      ))}
    </div>
  );
}
