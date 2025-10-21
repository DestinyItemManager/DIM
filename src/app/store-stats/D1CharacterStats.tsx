import { D1StatHashes } from 'app/destiny1/d1-manifest-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import * as styles from './D1CharacterStats.m.scss';

export function D1StoreCharacterStats({ store }: { store: DimStore }) {
  const subclass = findItemsByBucket(store, BucketHashes.Subclass).find((i) => i.equipped);
  return <D1CharacterStats stats={store.stats} subclassHash={subclass?.hash} />;
}

export function D1CharacterStats({
  stats,
  subclassHash,
}: {
  stats: DimStore['stats'];
  subclassHash?: number;
}) {
  const statList = Object.values(stats);
  const tooltips = statList.map((stat) => {
    const tier = Math.floor(Math.min(300, stat.value) / 60);
    const next = t('Stats.TierProgress', {
      context: tier === 5 ? 'Max' : '',
      metadata: { context: ['max'] },
      progress: tier === 5 ? stat.value : stat.value % 60,
      tier,
      nextTier: tier + 1,
      statName: stat.displayProperties.name,
    });

    const cooldown = subclassHash ? getAbilityCooldown(subclassHash, stat.hash, tier) : undefined;
    if (cooldown) {
      switch (stat.hash) {
        case D1StatHashes.Intellect:
          return next + t('Cooldown.Super', { cooldown });
        case D1StatHashes.Discipline:
          return next + t('Cooldown.Grenade', { cooldown });
        case D1StatHashes.Strength:
          return next + t('Cooldown.Melee', { cooldown });
      }
    }
    return next;
  });

  return (
    <div className={styles.statBars}>
      {statList.map((stat, index) => (
        <PressTip key={stat.hash} tooltip={tooltips[index]}>
          <div className={styles.stat}>
            <BungieImage src={stat.displayProperties.icon} alt={stat.displayProperties.name} />
            {getD1CharacterStatTiers(stat).map((n, index) => (
              <div key={index} className={styles.bar}>
                <div
                  className={clsx(styles.progress, {
                    [styles.complete]: n / 60 === 1,
                  })}
                  style={{ width: percent(n / 60) }}
                />
              </div>
            ))}
          </div>
        </PressTip>
      ))}
    </div>
  );
}

function getD1CharacterStatTiers(stat: DimCharacterStat) {
  const tiers = new Array<number>(5);
  let remaining = stat.value;
  for (let t = 0; t < 5; t++) {
    remaining -= tiers[t] = remaining > 60 ? 60 : remaining;
  }
  return tiers;
}

// Cooldowns
const cooldownsSuperA = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
const cooldownsSuperB = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
const cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
const cooldownsMelee = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

// following code is from https://github.com/DestinyTrialsReport
function getAbilityCooldown(subclass: number, statHash: D1StatHashes, tier: number) {
  switch (statHash) {
    case D1StatHashes.Intellect:
      switch (subclass) {
        case 2007186000: // Defender
        case 4143670656: // Nightstalker
        case 2455559914: // Striker
        case 3658182170: // Sunsinger
          return cooldownsSuperA[tier];
        default:
          return cooldownsSuperB[tier];
      }
    case D1StatHashes.Discipline:
      return cooldownsGrenade[tier];
    case D1StatHashes.Strength:
      switch (subclass) {
        case 4143670656: // Nightstalker
        case 1716862031: // Gunslinger
          return cooldownsMelee[tier];
        default:
          return cooldownsGrenade[tier];
      }
    default:
      return '';
  }
}
