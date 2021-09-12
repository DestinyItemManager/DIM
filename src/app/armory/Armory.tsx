import { DestinyAccount } from 'app/accounts/destiny-account';
import { addCompareItem } from 'app/compare/actions';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import ItemIcon from 'app/inventory/ItemIcon';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector, bucketsSelector, storesLoadedSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getEvent, getSeason } from 'app/inventory/store/season';
import EmblemPreview from 'app/item-popup/EmblemPreview';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { AmmoIcon, ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import ItemSockets from 'app/item-popup/ItemSockets';
import ItemStats from 'app/item-popup/ItemStats';
import MetricCategories from 'app/item-popup/MetricCategories';
import { useDefinitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { Reward } from 'app/progress/Reward';
import { AppIcon, compareIcon, faClock } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { getItemYear } from 'app/utils/item-utils';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import AllWishlistRolls from './AllWishlistRolls';
import styles from './Armory.m.scss';
import Links from './Links';

export default function Armory({
  account,
  itemHash,
}: {
  account: DestinyAccount;
  itemHash: number;
}) {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions();
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account, storesLoaded);
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);

  if (!storesLoaded || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  if (defs.isDestiny1()) {
    return <div>TODO: add D1 support</div>;
  }

  const itemDef = defs.InventoryItem.get(itemHash);

  const item = defs.isDestiny2() ? makeFakeItem(defs, buckets, undefined, itemHash) : undefined;

  if (!item) {
    return (
      <div className="dim-page">
        <h1>{t('Armory.Unknown')}</h1>
      </div>
    );
  }

  const storeItems = allItems.filter((i) => i.hash === itemHash);

  const collectible = item.collectibleHash ? defs.Collectible.get(item.collectibleHash) : undefined;

  const seasonNum = getSeason(item);
  const season = seasonNum
    ? Object.values(defs.Season.getAll()).find((s) => s.seasonNumber === seasonNum)
    : undefined;
  const event = getEvent(item);

  const screenshot = itemDef.screenshot;
  const flavorText = itemDef.flavorText || itemDef.displaySource;

  // TODO: Show Catalyst benefits for exotics

  return (
    <div
      className={clsx('dim-page', styles.armory)}
      style={
        screenshot
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.75) 0px, rgba(0,0,0,0) 200px), linear-gradient(180deg, rgba(0,0,0,0) 400px, #0b0c0f 500px), url("${bungieNetPath(
                screenshot
              )}")`,
            }
          : undefined
      }
    >
      <Links item={item} />
      <div className={styles.header}>
        <div className="item">
          <ItemIcon item={item} />
        </div>
        <div>
          <h1>{item.name}</h1>
          <div className={styles.subtitle}>
            <ElementIcon element={item.element} />
            {item.breakerType && <BungieImage src={item.breakerType.displayProperties.icon} />}
            {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
            <ItemTypeName item={item} />
            {item.pursuit?.questStepNum && (
              <div>
                {t('MovePopup.Subtitle.QuestProgress', {
                  questStepNum: item.pursuit.questStepNum,
                  questStepsTotal: item.pursuit.questStepsTotal,
                })}
              </div>
            )}
            {season && (
              <div className={styles.source}>
                {season.displayProperties.hasIcon && (
                  <BungieImage height={15} width={15} src={season.displayProperties.icon} />
                )}{' '}
                {season.displayProperties.name} (
                {t('Armory.Season', { season: season.seasonNumber, year: getItemYear(item) })})
                {event && <span> - {D2EventInfo[getEvent(item)].name}</span>}
              </div>
            )}
          </div>
          {item.tooltipNotifications?.map((tip) => (
            <div
              key={tip.displayString}
              className={clsx('quest-expiration item-details', {
                'seasonal-expiration': tip.displayStyle === 'seasonal-expiration',
              })}
            >
              {tip.displayStyle === 'seasonal-expiration' && <AppIcon icon={faClock} />}
              {tip.displayString}
            </div>
          ))}
          {item.classified && <div>{t('ItemService.Classified2')}</div>}
          {collectible?.sourceString && <div>{collectible?.sourceString}</div>}
          {item.description && (
            <p>
              <RichDestinyText text={item.description} />
            </p>
          )}
          {flavorText && <p className={styles.flavor}>{flavorText}</p>}
        </div>
      </div>

      {defs.isDestiny2() && item.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) && (
        <div className="item-details">
          <EmblemPreview item={item} />
        </div>
      )}

      {defs.isDestiny2() && item.availableMetricCategoryNodeHashes && (
        <div className="item-details">
          <MetricCategories
            availableMetricCategoryNodeHashes={item.availableMetricCategoryNodeHashes}
          />
        </div>
      )}

      {item.stats && !item.bucket.inArmor && (
        <div className={styles.section}>
          <ItemStats item={item} />
        </div>
      )}

      {item.sockets && (
        <div className={styles.section}>
          <ItemSockets item={item} minimal />
        </div>
      )}
      {item.pursuit && (
        <>
          {defs && item.objectives && (
            <div className={styles.section}>
              {item.objectives.map((objective) => (
                <Objective objective={objective} key={objective.objectiveHash} />
              ))}
            </div>
          )}
          {defs.isDestiny2() && item.pursuit.rewards.length !== 0 && (
            <div className={styles.section}>
              <div>{t('MovePopup.Rewards')}</div>
              {item.pursuit.rewards.map((reward) => (
                <Reward key={reward.itemHash} reward={reward} />
              ))}
            </div>
          )}
          {item.pursuit?.questLineDescription && (
            <p>
              <RichDestinyText text={item.pursuit.questLineDescription} ownerId={item.owner} />
            </p>
          )}
          {itemDef.setData?.itemList && (
            <ol>
              {itemDef.setData.itemList.map((h) => {
                const stepItem = makeFakeItem(defs, buckets, undefined, h.itemHash);
                return (
                  stepItem && (
                    <li
                      key={h.itemHash}
                      style={{ fontWeight: h.itemHash === itemHash ? 'bold' : 'normal' }}
                    >
                      <RichDestinyText text={stepItem.description} />
                    </li>
                  )
                );
              })}
            </ol>
          )}
        </>
      )}
      {storeItems.length > 0 && (
        <>
          <h2>
            {t('Armory.YourItems')}
            {storeItems[0].comparable && (
              <button
                className="dim-button"
                type="button"
                onClick={() => {
                  hideItemPopup();
                  dispatch(addCompareItem(storeItems[0]));
                }}
              >
                <AppIcon icon={compareIcon} /> {t('Compare.Button')}
              </button>
            )}
          </h2>
          <div className="sub-bucket">
            {storeItems.length > 0 ? (
              storeItems.map((i) => (
                <ItemPopupTrigger item={i} key={i.index}>
                  {(ref, onClick) => (
                    <ConnectedInventoryItem innerRef={ref} onClick={onClick} item={i} />
                  )}
                </ItemPopupTrigger>
              ))
            ) : (
              <p>{t('Armory.NoItems')}</p>
            )}
          </div>
        </>
      )}
      <AllWishlistRolls item={item} />
    </div>
  );
}
