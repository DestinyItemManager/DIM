import { trackTriumph } from 'app/dim-api/basic-actions';
import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { createItemContextSelector } from 'app/inventory/selectors';
import { isBooleanObjective } from 'app/inventory/store/objectives';
import { useD2Definitions } from 'app/manifest/selectors';
import { Reward } from 'app/progress/Reward';
import { percent } from 'app/shell/formatters';
import { RootState } from 'app/store/types';
import { sumBy } from 'app/utils/collections';
import { HashLookup } from 'app/utils/util-types';
import {
  DestinyItemQuantity,
  DestinyObjectiveProgress,
  DestinyRecordComponent,
  DestinyRecordDefinition,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import catalystIcons from 'data/d2/catalyst-triumph-icons.json';
import dimTrackedIcon from 'images/dimTrackedIcon.svg';
import osteoStrigaCatalyst from 'images/osteo-striga-catalyst.jpg';
import trackedIcon from 'images/trackedIcon.svg';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ishtarIcon from '../../images/ishtar-collective.svg';
import BungieImage from '../dim-ui/BungieImage';
import ExternalLink from '../dim-ui/ExternalLink';
import Objective from '../progress/Objective';
import * as styles from './Record.m.scss';
import { makeItemForCatalystRecord } from './catalysts';
import { DimRecord } from './presentation-nodes';

interface RecordInterval {
  objective: DestinyObjectiveProgress;
  score: number;
  percentCompleted: number;
  isRedeemed: boolean;
  rewards: DestinyItemQuantity[];
}

const catalystIconsTable = catalystIcons as HashLookup<string>;

function Record({
  record,
  redactedRecordsRevealed,
}: {
  record: DimRecord;
  redactedRecordsRevealed: boolean;
}) {
  const defs = useD2Definitions()!;
  const { recordDef, trackedInGame, recordComponent } = record;
  const state = recordComponent.state;
  const recordHash = recordDef.hash;
  const dispatch = useDispatch();

  const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
  const unlocked = !acquired && !(state & DestinyRecordState.ObjectiveNotCompleted);
  const obscured =
    !redactedRecordsRevealed &&
    !unlocked &&
    !acquired &&
    Boolean(state & DestinyRecordState.Obscured);
  const trackedInDim = useSelector((state: RootState) =>
    trackedTriumphsSelector(state).includes(recordHash),
  );
  const loreLink =
    !obscured &&
    recordDef.loreHash !== undefined &&
    `http://www.ishtar-collective.net/entries/${recordDef.loreHash}`;

  const recordShouldGlow = (recordDef.forTitleGilding && acquired) || trackedInDim;

  const name = obscured ? recordDef.stateInfo.obscuredName : recordDef.displayProperties.name;

  const description = obscured
    ? recordDef.stateInfo.obscuredDescription
    : recordDef.displayProperties.description;

  const OSTEO_STRIGA_RECORD_HASH = 494981303;
  const isCatalyst = recordHash in catalystIconsTable;
  const recordIcon =
    recordHash === OSTEO_STRIGA_RECORD_HASH
      ? `~${osteoStrigaCatalyst}`
      : isCatalyst
        ? catalystIconsTable[recordHash]
        : recordDef.displayProperties.icon;

  const itemCreationContext = useSelector(createItemContextSelector);
  const catalystTarget = isCatalyst && makeItemForCatalystRecord(recordHash, itemCreationContext);

  const intervals = getIntervals(recordDef, recordComponent);
  const intervalBarStyle = {
    width: `calc((100% / ${intervals.length}) - 2px)`,
  };
  const allIntervalsCompleted = intervals.every((i) => i.percentCompleted >= 1.0);
  const intervalProgressBar = !obscured && intervals.length > 0 && (
    <div
      className={clsx(styles.intervalContainer, {
        [styles.complete]: allIntervalsCompleted,
      })}
    >
      {!allIntervalsCompleted &&
        intervals.map((i) => {
          const redeemed = i.isRedeemed;
          const unlocked = i.percentCompleted >= 1.0;
          return (
            <div
              key={i.objective.objectiveHash}
              className={clsx(styles.interval, {
                [styles.intervalRedeemed]: redeemed,
                [styles.intervalRedeemed]: unlocked && !redeemed,
              })}
              style={intervalBarStyle}
            >
              {!(redeemed || unlocked) && (
                <div
                  className={clsx(styles.interval, styles.intervalUnlocked)}
                  style={{ width: percent(i.percentCompleted) }}
                />
              )}
            </div>
          );
        })}
    </div>
  );

  let scoreValue = <>{t('Progress.RecordValue', { value: recordDef.completionInfo.ScoreValue })}</>;
  if (intervals.length > 1) {
    const currentScore = sumBy(
      intervals.slice(0, recordComponent.intervalsRedeemedCount),
      (i) => i.score,
    );
    const totalScore = sumBy(intervals, (i) => i.score);
    scoreValue = (
      <>
        <span className={styles.currentScore}>{currentScore}</span> /{' '}
        {t('Progress.RecordValue', { value: totalScore })}
      </>
    );
  }

  const objectives =
    intervals.length > 0
      ? [
          intervals[Math.min(recordComponent.intervalsRedeemedCount, intervals.length - 1)]
            .objective,
        ]
      : recordComponent.objectives;
  const rewards =
    intervals.length > 0
      ? intervals[Math.min(recordComponent.intervalsRedeemedCount, intervals.length - 1)].rewards
      : recordDef.rewardItems;
  const showObjectives =
    !obscured &&
    objectives &&
    ((!obscured && objectives.length > 1) ||
      (objectives.length === 1 &&
        !isBooleanObjective(
          defs.Objective.get(objectives[0].objectiveHash),
          objectives[0].progress ?? 0,
          objectives[0].completionValue,
        )));

  // TODO: show track badge greyed out / on hover
  // TODO: track on click
  const toggleTracked = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(trackTriumph({ recordHash, tracked: !trackedInDim }));
  };

  return (
    <div
      className={clsx(styles.triumphRecord, {
        [styles.redeemed]: acquired,
        [styles.unlocked]: unlocked,
        [styles.gildingTriumph]: recordDef.forTitleGilding,
        [styles.obscured]: obscured,
        [styles.tracked]: trackedInGame,
        [styles.trackedInDim]: trackedInDim,
        [styles.multistep]: intervals.length > 0,
      })}
    >
      {recordShouldGlow && <div className={styles.glow} />}
      {catalystTarget && recordIcon ? (
        <ItemPopupTrigger item={catalystTarget}>
          {(ref, onClick) => (
            <div className={styles.item} role="button" ref={ref} onClick={onClick}>
              <BungieImage className={styles.icon} src={recordIcon} />
            </div>
          )}
        </ItemPopupTrigger>
      ) : (
        recordIcon && <BungieImage className={styles.icon} src={recordIcon} />
      )}
      <div className={styles.info}>
        {!obscured && recordDef.completionInfo && <div className={styles.score}>{scoreValue}</div>}
        <h3>{name}</h3>
        {description && (
          <p>
            <RichDestinyText text={description} />
          </p>
        )}
        {showObjectives && (
          <div className={styles.objectives}>
            {objectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} />
            ))}
          </div>
        )}
        {loreLink && (
          <div className={styles.recordLore}>
            <ExternalLink href={loreLink}>
              <img src={ishtarIcon} height="16" width="16" />
            </ExternalLink>
            <ExternalLink href={loreLink}>{t('MovePopup.ReadLore')}</ExternalLink>
          </div>
        )}
        {rewards &&
          !acquired &&
          !obscured &&
          rewards.map((reward) => <Reward key={reward.itemHash} reward={reward} />)}
        {recordDef.forTitleGilding && !obscured && (
          <p className={styles.gildingText}>{t('Triumphs.GildingTriumph')}</p>
        )}
        {trackedInGame && <img className={styles.trackedIcon} src={trackedIcon} />}
      </div>
      {(!acquired || trackedInDim) && (
        <div role="button" onClick={toggleTracked} className={styles.dimTrackedIcon}>
          <img src={dimTrackedIcon} />
        </div>
      )}
      {intervalProgressBar}
    </div>
  );
}

function getIntervals(
  definition: DestinyRecordDefinition,
  record: DestinyRecordComponent,
): RecordInterval[] {
  const intervalDefinitions = definition?.intervalInfo?.intervalObjectives || [];
  const intervalObjectives = record?.intervalObjectives || [];
  const intervalRewards = definition?.intervalInfo?.intervalRewards || [];
  if (intervalDefinitions.length !== intervalObjectives.length) {
    return [];
  }

  const intervals: RecordInterval[] = [];
  let isPrevIntervalComplete = true;
  let prevIntervalProgress = 0;
  for (let i = 0; i < intervalDefinitions.length; i++) {
    const def = intervalDefinitions[i];
    const data = intervalObjectives[i];
    const rewards = intervalRewards[i].intervalRewardItems;

    intervals.push({
      objective: data,
      score: def.intervalScoreValue,
      percentCompleted: isPrevIntervalComplete
        ? data.complete
          ? 1
          : Math.max(
              0,
              ((data.progress || 0) - prevIntervalProgress) /
                (data.completionValue - prevIntervalProgress),
            )
        : 0,
      isRedeemed: record.intervalsRedeemedCount >= i + 1,
      rewards,
    });

    isPrevIntervalComplete = data.complete;
    prevIntervalProgress = data.completionValue;
  }
  return intervals;
}

/** A grid of records as seen in triumph presentation nodes or Tracked Triumphs. */
export function RecordGrid({
  records,
  redactedRecordsRevealed,
}: {
  records: DimRecord[];
  redactedRecordsRevealed: boolean;
}) {
  // TODO: was there really a problem with duplicate records?
  const seenRecords = new Set<number>();

  return (
    <div className={styles.recordsGrid}>
      {records.map((record) => {
        if (seenRecords.has(record.recordDef.hash)) {
          return null;
        }
        seenRecords.add(record.recordDef.hash);
        return (
          <Record
            key={record.recordDef.hash}
            record={record}
            redactedRecordsRevealed={redactedRecordsRevealed}
          />
        );
      })}
    </div>
  );
}
