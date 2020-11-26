import { t, tl } from 'app/i18next-t';
import { statTier } from 'app/loadout-builder/utils';
import { D2ArmorStatHashByName } from 'app/search/d2-known-values';
import {
  getClassAbilityCooldowns,
  getStatEffects,
  isClassAbilityStat,
} from 'app/utils/stat-effect-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';
import styles from './StatTooltip.m.scss';

interface Stat {
  hash: number;
  name: string;
  value: number;
  description: string;
}

interface Props {
  stat: Stat;
  characterClass?: DestinyClass;
}

function getClassAbilityCooldownTranslation(characterClass?: DestinyClass) {
  switch (characterClass) {
    case DestinyClass.Hunter:
      return tl('Stats.DodgeCooldown');
    case DestinyClass.Warlock:
      return tl('Stats.RiftCooldown');
    case DestinyClass.Titan:
      return tl('Stats.BarricadeCooldown');
    default:
      return null;
  }
}

function getAbilityTranslation(statHash: number) {
  switch (statHash) {
    case D2ArmorStatHashByName.mobility:
      return tl('Stats.Effect');
    case D2ArmorStatHashByName.recovery:
      return tl('Stats.Effect');
    case D2ArmorStatHashByName.resilience:
      return tl('Stats.Effect');
    case D2ArmorStatHashByName.intellect:
      return tl('Stats.SuperCooldown');
    case D2ArmorStatHashByName.discipline:
      return tl('Stats.GrenadeCooldown');
    case D2ArmorStatHashByName.strength:
      return tl('Stats.MeleeCooldown');
    default:
      return null;
  }
}

function StatTooltip({ stat, characterClass }: Props) {
  const abilityTranslation = getAbilityTranslation(stat.hash);
  const classAbilityTranslation = getClassAbilityCooldownTranslation(characterClass);
  const tier = statTier(stat.value);
  const statEffects = getStatEffects(stat.hash);
  const classAbilityEffects = getClassAbilityCooldowns(characterClass);

  return (
    <div>
      <div className={styles.name}>{stat.name}</div>
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      {abilityTranslation && statEffects ? (
        <div className={styles.values}>
          <div className={styles.label}>{t(abilityTranslation)}</div>
          <div className={styles.value}>{`${statEffects.values[tier]}${statEffects.units}`}</div>
        </div>
      ) : null}
      {classAbilityTranslation &&
      classAbilityEffects &&
      isClassAbilityStat(stat.hash, characterClass) ? (
        <div className={styles.values}>
          <div className={styles.label}>{t(classAbilityTranslation)}</div>
          <div className={styles.value}>{classAbilityEffects.values[tier]}</div>
        </div>
      ) : null}
      <div className={styles.description}>{stat.description}</div>
    </div>
  );
}

export default StatTooltip;
