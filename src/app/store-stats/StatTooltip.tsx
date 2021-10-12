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
  characterClass: DestinyClass;
}

function getClassAbilityCooldownTranslation(characterClass: DestinyClass) {
  switch (characterClass) {
    case DestinyClass.Hunter:
      return tl('Stats.DodgeCooldown');
    case DestinyClass.Warlock:
      return tl('Stats.RiftCooldown');
    case DestinyClass.Titan:
      return tl('Stats.BarricadeCooldown');
    default:
      return undefined;
  }
}

function getLightAbilityTranslation(statHash: number) {
  switch (statHash) {
    case D2ArmorStatHashByName.intellect:
      return tl('Stats.LightSuperCooldown');
    case D2ArmorStatHashByName.discipline:
      return tl('Stats.LightGrenadeCooldown');
    case D2ArmorStatHashByName.strength:
      return tl('Stats.LightMeleeCooldown');
    default:
      return undefined;
  }
}

function getDarkAbilityTranslation(statHash: number) {
  switch (statHash) {
    case D2ArmorStatHashByName.intellect:
      return tl('Stats.DarkSuperCooldown');
    case D2ArmorStatHashByName.discipline:
      return tl('Stats.DarkGrenadeCooldown');
    case D2ArmorStatHashByName.strength:
      return tl('Stats.DarkMeleeCooldown');
    default:
      return undefined;
  }
}

function StatTooltip({ stat, characterClass }: Props) {
  const lightAbilityTranslation = getLightAbilityTranslation(stat.hash);
  const darkAbilityTranslation = getDarkAbilityTranslation(stat.hash);

  const classAbilityTranslation = getClassAbilityCooldownTranslation(characterClass);
  const tier = statTier(stat.value);
  const statEffects = getStatEffects(stat.hash, characterClass);
  const classAbilityEffects = getClassAbilityCooldowns(characterClass);
  const lightEffect = statEffects?.light?.[tier];
  const darkEffect = statEffects?.dark?.[tier];

  return (
    <div>
      <div className={styles.name}>{stat.name}</div>
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      {$featureFlags.abilityCooldowns && lightAbilityTranslation && lightEffect ? (
        <div className={styles.values}>
          <div className={styles.label}>{t(lightAbilityTranslation)}</div>
          <div className={styles.value}>{lightEffect}</div>
        </div>
      ) : null}
      {$featureFlags.abilityCooldowns && darkAbilityTranslation && darkEffect ? (
        <div className={styles.values}>
          <div className={styles.label}>{t(darkAbilityTranslation)}</div>
          <div className={styles.value}>{darkEffect}</div>
        </div>
      ) : null}
      {$featureFlags.abilityCooldowns &&
      classAbilityTranslation &&
      classAbilityEffects &&
      isClassAbilityStat(stat.hash, characterClass) ? (
        <div className={styles.values}>
          <div className={styles.label}>{t(classAbilityTranslation)}</div>
          <div className={styles.value}>{classAbilityEffects[tier]}</div>
        </div>
      ) : null}
      <div className={styles.description}>{stat.description}</div>
    </div>
  );
}

export default StatTooltip;
