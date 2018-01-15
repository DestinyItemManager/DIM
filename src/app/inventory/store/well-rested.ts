import { DestinyCharacterProgressionComponent, DestinyProgression, DestinyProgressionDefinition } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions.service';

/**
 * Figure out whether a character has the "well rested" buff, which applies a 3x XP boost
 * for the first three levels each week. Ideally this would just come back in the response,
 * but instead we have to calculate it from the weekly XP numbers.
 */
export function isWellRested(
  defs: D2ManifestDefinitions,
  characterProgression: DestinyCharacterProgressionComponent
) {
  // We have to look at both the regular progress and the "legend" levels you gain after hitting the cap.
  // Thanks to expansions that raise the level cap, you may go back to earning regular XP after getting legend levels.
  const levelProgressDef = defs.Progression.get(1716568313);
  const levelProgress = characterProgression.progressions[levelProgressDef.hash];
  const legendProgressDef = defs.Progression.get(2030054750);
  const legendProgress = characterProgression.progressions[legendProgressDef.hash];

  console.log(legendProgress, levelProgress);

  if (levelProgress.level < 4) {
    return true;
  }

  return levelsGained(levelProgress, levelProgressDef) + levelsGained(legendProgress, legendProgressDef) < 3;
}

/**
 * How many levels were gained this week for this particular type of progress?
 *
 * Note: caps at 3 levels since we don't need more.
 */
function levelsGained(
  progress: DestinyProgression,
  progressDef: DestinyProgressionDefinition
) {
  let levels = 0;
  let currentLevel = progress.level;

  let xpProgress = progress.weeklyProgress - progress.progressToNextLevel;
  while (xpProgress > 0 && levels < 3 && currentLevel > 1) {
    levels++;
    currentLevel--;
    xpProgress -= xpRequiredForLevel(currentLevel, progressDef);
  }

  return levels;
}

/**
 * How much XP was required to achieve the given level?
 */
function xpRequiredForLevel(
  level: number,
  progressDef: DestinyProgressionDefinition
) {
  const stepIndex = Math.min(Math.max(0, level), progressDef.steps.length - 1);
  // each step may be a different amount of XP. The x2 multiplier is from the saled-XP fiasco, I think
  return progressDef.steps[stepIndex].progressTotal * 2;
}
