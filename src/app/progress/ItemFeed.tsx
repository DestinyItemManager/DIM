import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import ClassIcon from 'app/dim-ui/ClassIcon';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { setItemTag } from 'app/inventory-actions/actions';
import ConnectedInventoryItem from 'app/inventory-item/ConnectedInventoryItem';
import { DefItemIcon } from 'app/inventory-item/ItemIcon';
import ItemPopupTrigger from 'app/inventory-item/ItemPopupTrigger';
import { getTag, tagConfig, TagValue } from 'app/inventory-stores/dim-item-info';
import { DimItem, DimStat } from 'app/inventory-stores/item-types';
import { allItemsSelector, itemInfosSelector } from 'app/inventory-stores/selectors';
import { ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { useSetting } from 'app/settings/hooks';
import { acquisitionRecencyComparator } from 'app/shell/filters';
import { AppIcon, collapseIcon, faCaretUp } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptyArray } from 'app/utils/empty';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getWeaponArchetype } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { AnimatePresence, motion, Spring } from 'framer-motion';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ItemFeed.m.scss';

const spring: Spring = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
};

export default function ItemFeed() {
  const allItems = useSelector(allItemsSelector);
  const itemInfos = useSelector(itemInfosSelector);
  const [hideTagged, setHideTagged] = useSetting('itemFeedHideTagged');
  const [expanded, setExpanded] = useSetting('itemFeedExpanded');
  const [itemsToShow, setItemsToShow] = useState(10);

  const items = expanded
    ? _.take(
        allItems
          .filter(
            (i) =>
              i.equipment && i.power > 0 && i.taggable && (!hideTagged || !getTag(i, itemInfos))
          )
          .sort(acquisitionRecencyComparator),
        itemsToShow
      )
    : emptyArray<DimItem>();

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setItemsToShow(10);
    }
  };

  const handlePaginate = () => {
    setItemsToShow((itemsToShow) => itemsToShow + 10);
  };

  useEffect(() => {
    document.querySelector('html')!.style.setProperty('--expanded-sidebars', `${expanded ? 1 : 0}`);
  }, [expanded]);

  return (
    <div className={clsx(styles.trayContainer, { [styles.expanded]: expanded })}>
      <button className={styles.trayButton} type="button" onClick={handleToggle}>
        {t('ItemFeed.Description')} <AppIcon icon={expanded ? collapseIcon : faCaretUp} />
      </button>
      {expanded && (
        <div className={styles.sideTray}>
          <CheckButton name="hideTagged" checked={hideTagged} onChange={setHideTagged}>
            {t('ItemFeed.HideTagged')}
          </CheckButton>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <Item key={item.index} item={item} tag={getTag(item, itemInfos)} />
            ))}
            <motion.div onViewportEnter={handlePaginate} />
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Item({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  return (
    <motion.div
      className={styles.item}
      layout
      initial={{ scale: 0, opacity: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring}
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
          {archetype && <span>{archetype} </span>}
          <ItemTypeName item={item} />
        </span>
        <div className={styles.perks}>
          {_.takeRight(perkSockets, 2)
            .flatMap((s) => s.plugOptions)
            .map((p) => (
              <div key={p.plugDef.hash}>
                <PressTip tooltip={() => <DimPlugTooltip item={item} plug={p} />}>
                  <DefItemIcon itemDef={p.plugDef} borderless={true} />{' '}
                  {p.plugDef.displayProperties.name}
                </PressTip>
              </div>
            ))}
        </div>
      </div>
    );
  } else if (item.bucket.sort === 'Armor') {
    const renderStat = (stat: DimStat) => (
      <div key={stat.statHash} className="stat">
        {stat.displayProperties.hasIcon ? (
          <span title={stat.displayProperties.name}>
            <BungieImage src={stat.displayProperties.icon} />
          </span>
        ) : (
          stat.displayProperties.name + ': '
        )}
        {stat.value}
      </div>
    );
    return (
      <div className={clsx(styles.stats, 'stat-bars', 'destiny2')}>
        <div className="stat-row">{item.stats?.filter((s) => s.statHash > 0).map(renderStat)}</div>
        <div className="stat-row">{item.stats?.filter((s) => s.statHash < 0).map(renderStat)}</div>
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
          className={styles.tagButton}
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
