import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { createItemContextSelector, profileResponseSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import styles from './ArtifactUnlocks.m.scss';

export default function ArtifactUnlocks({ characterId }: { characterId: string }) {
  const profileResponse = useSelector(profileResponseSelector);
  const defs = useD2Definitions();
  const context = useSelector(createItemContextSelector);

  if (!profileResponse || !defs) {
    return null;
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
                  <ItemPopupTrigger key={item.item.index} item={item.item}>
                    {(ref, onClick) => (
                      <div
                        ref={ref}
                        onClick={onClick}
                        title={item.item!.name}
                        style={bungieBackgroundStyle(item.item!.icon)}
                        className={clsx('item', styles.item, {
                          [styles.unlocked]: item.isActive,
                          [styles.locked]: !item.isActive,
                        })}
                      />
                    )}
                  </ItemPopupTrigger>
                ),
            )}
          </div>
        ))}
      </div>
    </>
  );
}
