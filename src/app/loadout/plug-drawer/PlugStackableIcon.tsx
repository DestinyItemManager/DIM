import { t } from 'app/i18next-t';
import { AppIcon, slashIcon, stackIcon } from 'app/shell/icons';
import { DimPlugDescriptions } from 'app/utils/plug-descriptions';
import clsx from 'clsx';
import unstackableModHashes from 'data/d2/unstackable-mods.json';
import styles from './PlugStackableIcon.m.scss';

/** A label that shows whether an armor mod is stackable or not. */
export default function PlugStackableIcon({
  hash,
  descriptions,
  className,
}: {
  hash: number;
  descriptions: DimPlugDescriptions;
  className?: string;
}) {
  const hasRequirements = descriptions.perks.some((perk) => perk.requirement);
  const unstackable = unstackableModHashes.includes(hash);
  if (!hasRequirements && !unstackable) {
    return null;
  }

  return (
    <div className={clsx(styles.stackable, className)}>
      {unstackable ? (
        <>
          <span className={styles.stack}>
            <AppIcon icon={slashIcon} ariaHidden />
            <AppIcon icon={stackIcon} ariaHidden />
          </span>
          {t('Loadouts.ModPlacement.UnstackableMod')}
        </>
      ) : (
        <>
          <AppIcon icon={stackIcon} ariaHidden /> {t('Loadouts.ModPlacement.StackableMod')}
        </>
      )}
    </div>
  );
}
