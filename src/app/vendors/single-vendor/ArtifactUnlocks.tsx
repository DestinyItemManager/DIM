import { BasicItemTrigger, PopupState } from 'app/armory/ItemGrid';
import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { createItemContextSelector, profileResponseSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import ItemPopup from 'app/item-popup/ItemPopup';
import { useD2Definitions } from 'app/manifest/selectors';
import { infoLog } from 'app/utils/log';
import clsx from 'clsx';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ArtifactUnlocks.m.scss';

export default function ArtifactUnlocks({ characterId }: { characterId: string }) {
  const profileResponse = useSelector(profileResponseSelector);
  const defs = useD2Definitions();
  const context = useSelector(createItemContextSelector);
  const [popup, setPopup] = useState<PopupState | undefined>();

  if (!profileResponse || !defs) {
    return null;
  }

  if (popup) {
    infoLog('clicked item', popup.item);
  }

  const artifactUnlockData =
    profileResponse.characterProgressions.data?.[characterId]?.seasonalArtifact;

  if (!artifactUnlockData) {
    return null;
  }

  const tiers = artifactUnlockData.tiers.map((tier) => ({
    ...tier,
    items: tier.items
      .filter((i) => i.isVisible)
      .map((i) => ({ item: makeFakeItem(context, i.itemHash), isActive: i.isActive })),
  }));
  const { resetCount = 0, pointsUsed = 0 } = artifactUnlockData;

  return (
    <>
      <div className={styles.stat}>
        <div>{t('Progress.PointsUsed', { count: pointsUsed })}</div>
        <div>{t('Progress.Resets', { count: resetCount })}</div>
      </div>
      <div className={styles.tiers}>
        {tiers.map((tier) => (
          <div
            key={tier.tierHash}
            className={clsx(styles.tier, {
              [styles.unlockedTier]: tier.isUnlocked,
            })}
          >
            {tier.items.map(
              (item) =>
                item.item && (
                  <BasicItemTrigger key={item.item.index} item={item.item} onShowPopup={setPopup}>
                    {(ref, showPopup) => (
                      <div
                        ref={ref}
                        onClick={showPopup}
                        title={item.item!.name}
                        style={bungieBackgroundStyle(item.item!.icon)}
                        className={clsx('item', styles.item, {
                          [styles.unlocked]: item.isActive,
                          [styles.locked]: !item.isActive,
                        })}
                      />
                    )}
                  </BasicItemTrigger>
                ),
            )}
          </div>
        ))}
      </div>
      {popup && (
        <ItemPopup onClose={() => setPopup(undefined)} item={popup.item} element={popup.element} />
      )}
    </>
  );
}
