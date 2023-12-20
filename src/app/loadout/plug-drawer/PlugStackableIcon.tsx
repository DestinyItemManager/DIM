import { AppIcon, banIcon, faCheck, stackIcon } from 'app/shell/icons';
import { DimPlugDescriptions } from 'app/utils/plug-descriptions';
import unstackableModHashes from 'data/d2/unstackable-mods.json';
import { t } from 'i18next';
import styles from './PlugStackableIcon.m.scss';

/** A label that shows whether an armor mod is stackable or not. */
export default function PlugStackableIcon({
  hash,
  descriptions,
}: {
  hash: number;
  descriptions: DimPlugDescriptions;
}) {
  const hasRequirements = descriptions.perks.some((perk) => perk.requirement);
  const unstackable = unstackableModHashes.includes(hash);
  if (!hasRequirements && !unstackable) {
    return null;
  }

  return (
    <div className={styles.stackable}>
      {unstackable ? (
        <>
          <AppIcon icon={banIcon} ariaHidden /> <AppIcon icon={stackIcon} ariaHidden />{' '}
          {t('Loadouts.ModPlacement.UnstackableMod')}
        </>
      ) : (
        <>
          <AppIcon icon={faCheck} ariaHidden /> <AppIcon icon={stackIcon} ariaHidden />{' '}
          {t('Loadouts.ModPlacement.StackableMod')}
        </>
      )}
    </div>
  );
}
