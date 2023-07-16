import { useIsPhonePortrait } from 'app/shell/selectors';
import Game2Give from './Game2Give';

/**
 * A popup we can enable to get the word out about important issues for the DIM community. Edit the body directly.
 */
export default function IssueAwarenessBanner() {
  const isPhonePortrait = useIsPhonePortrait();

  return <>{!isPhonePortrait && <Game2Give />}</>;
}
