import { DestinyCharacterProgressionComponent, DestinyProgressionDefinition } from 'bungie-api-ts/destiny2';
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
  const levelProgress = characterProgression.progressions[1716568313];
  const legendProgressDef = defs.Progression.get(2030054750);
  const legendProgress = characterProgression.progressions[2030054750];

  // You can only be well-rested if you've hit the normal level cap.
  // And if you haven't ever gained 3 legend levels, no dice.
  if (levelProgress.level < levelProgress.levelCap ||
      legendProgress.level < 4) {
    return false;
  }

  // Have you gained XP equal to three full levels worth of XP?
  return legendProgress.weeklyProgress >
    xpRequiredForLevel(legendProgress.level, legendProgressDef) +
    xpRequiredForLevel(legendProgress.level - 1, legendProgressDef) +
    xpRequiredForLevel(legendProgress.level - 2, legendProgressDef);
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
