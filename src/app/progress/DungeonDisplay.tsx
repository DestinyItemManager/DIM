import { t } from 'app/i18next-t';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { ActivityModifier } from './ActivityModifier';
import './milestone.scss';
import {
  ObjectiveCheckbox,
  ObjectiveDescription,
  ObjectiveProgress,
  ObjectiveRow,
} from './Objective';
import * as styles from './RaidDisplay.m.scss';

/**
 * Outer wrapper of Dungeon type
 */
export function DungeonDisplay({
  displayProperties,
  complete,
  children,
}: {
  displayProperties: DestinyDisplayPropertiesDefinition;
  complete: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="milestone-quest">
      <div className="milestone-icon">
        {displayProperties.hasIcon && (
          <BungieImage className="milestone-img" src={displayProperties.icon} />
        )}
      </div>

      <div className={clsx('milestone-info', styles.raidTiers)}>
        <span className="milestone-name">{displayProperties.name}</span>

        <ObjectiveRow complete={complete} className={styles.questObjectives} boolean>
          <ObjectiveCheckbox completed={complete} />
          <ObjectiveProgress>
            <ObjectiveDescription description={t('Progress.DungeonWeeklyChallenge')} />
          </ObjectiveProgress>
        </ObjectiveRow>

        {children}
      </div>
    </div>
  );
}

/**
 * Describes difficulty tier and modifiers if applicable.
 *
 * Similar in structure to Raid Activities, but Bungie API does not expose
 * phase information for Dungeons.
 */
export function DungeonActivity({
  displayName,
  modifierHashes,
}: {
  displayName?: string;
  modifierHashes: readonly number[];
}) {
  return (
    <div className={styles.raidActivity}>
      {displayName && <span className="milestone-name">{displayName}</span>}

      {modifierHashes.map((modifierHash) => (
        <ActivityModifier key={modifierHash} modifierHash={modifierHash} small />
      ))}
    </div>
  );
}
