import { t } from 'app/i18next-t';
import { D1ProgressionHashes } from 'app/search/d1-known-values';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { PressTip } from '../dim-ui/PressTip';
import { D1Store } from '../inventory/store-types';
import * as styles from './CharacterHeaderXP.m.scss';

function getLevelBar(store: D1Store) {
  const prestige = store.progressions.find(
    (p) => p.progressionHash === D1ProgressionHashes.Prestige,
  );
  let levelBar = store?.percentToNextLevel ?? 0;
  let xpTillMote: string | undefined = undefined;
  if (prestige) {
    levelBar = prestige.progressToNextLevel / prestige.nextLevelAt;
    xpTillMote = t('Stats.Prestige', {
      level: prestige.level,
      exp: prestige.nextLevelAt - prestige.progressToNextLevel,
    });
  }
  return {
    levelBar,
    xpTillMote,
  };
}

// This is just a D1 feature, so it only accepts a D1 store.
export default function CharacterHeaderXPBar({ store }: { store: D1Store }) {
  const { levelBar, xpTillMote } = getLevelBar(store);
  return (
    <div className={styles.xpBar}>
      <PressTip tooltip={xpTillMote}>
        <div className={styles.levelBar}>
          <div
            className={clsx(styles.levelBarProgress, {
              [styles.moteProgress]: !store.percentToNextLevel,
            })}
            style={{ width: percent(levelBar) }}
          />
        </div>
      </PressTip>
    </div>
  );
}
