import ItemGrid from 'app/armory/ItemGrid';
import { addCompareItem } from 'app/compare/actions';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import ItemIcon from 'app/inventory-item/ItemIcon';
import { allItemsSelector, bucketsSelector } from 'app/inventory-stores/selectors';
import { makeFakeItem } from 'app/inventory-stores/store/d2-item-factory';
import {
  applySocketOverrides,
  SocketOverrides,
  useSocketOverrides,
} from 'app/inventory-stores/store/override-sockets';
import { getEvent, getSeason } from 'app/inventory-stores/store/season';
import EmblemPreview from 'app/item-popup/EmblemPreview';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { AmmoIcon, ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import ItemSockets from 'app/item-popup/ItemSockets';
import ItemStats from 'app/item-popup/ItemStats';
import MetricCategories from 'app/item-popup/MetricCategories';
import { useD2Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { Reward } from 'app/progress/Reward';
import { AppIcon, compareIcon, faClock } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
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
  itemHash,
  sockets,
}: {
  itemHash: number;
  sockets?: SocketOverrides;
}) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const isPhonePortrait = useIsPhonePortrait();
  const [socketOverrides, onPlugClicked] = useSocketOverrides();

  const itemDef = defs.InventoryItem.get(itemHash);

  const itemWithoutSockets = makeFakeItem(defs, buckets, undefined, itemHash);

  if (!itemWithoutSockets) {
    return (
      <div>
        <h1>{t('Armory.Unknown')}</h1>
      </div>
    );
  }

  // We apply socket overrides *twice* - once to set the original sockets, then to apply the user's chosen overrides
  const item = applySocketOverrides(
    defs,
    applySocketOverrides(defs, itemWithoutSockets, sockets),
    socketOverrides
  );

  const storeItems = allItems.filter((i) => i.hash === itemHash);

  const collectible = item.collectibleHash ? defs.Collectible.get(item.collectibleHash) : undefined;

  const seasonNum = getSeason(item);
  const season = seasonNum
    ? Object.values(defs.Season.getAll()).find((s) => s.seasonNumber === seasonNum)
    : undefined;
  const event = getEvent(item);

  // Use the ornament's screenshot if available
  const ornamentSocket = item.sockets?.allSockets.find((s) => s.plugged?.plugDef.screenshot);
  const screenshot = ornamentSocket?.plugged?.plugDef.screenshot || itemDef.screenshot;
  const flavorText = itemDef.flavorText || itemDef.displaySource;

  // TODO: Show Catalyst benefits for exotics

  return (
    <div
      className={styles.armory}
      style={
        screenshot && !isPhonePortrait
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
        <h1>{item.name}</h1>
        <div className={styles.headerContent}>
          <div className={styles.subtitle}>
            <ElementIcon element={item.element} className={styles.element} />
            {item.breakerType && (
              <BungieImage src={item.breakerType.displayProperties.icon} height={15} />
            )}
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

      {isPhonePortrait && screenshot && (
        <div className="item-details">
          <BungieImage width="100%" src={screenshot} />
        </div>
      )}

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
          <ItemSockets item={item} grid onPlugClicked={onPlugClicked} />
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
          <ItemGrid items={storeItems} noLink />
        </>
      )}
      <AllWishlistRolls item={item} />
    </div>
  );
}
