import { useHistory } from 'react-router-dom';
import { History } from 'history';

export let globalHistory: History | null = null;

/**
 * Capture the "history" object to a global. We shouldn't do this, but it makes
 * migrating to react-router easier.
 */
export default function CaptureHistory() {
  globalHistory = useHistory();
  return null;
}
