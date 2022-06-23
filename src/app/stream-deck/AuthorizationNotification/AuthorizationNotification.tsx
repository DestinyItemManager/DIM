import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { DeferredPromise } from 'app/stream-deck/util/deferred';
import styles from './AuthorizationNotification.m.scss';

interface StreamDeckChallengeProps {
  challenge: number;
}

function StreamDeckChallenge({ challenge }: StreamDeckChallengeProps) {
  return (
    <div className={styles.authorization}>
      <span>{t('StreamDeck.Authorization.Title')}</span>
      <div className={styles.authorizationChallenge}>{challenge}</div>
    </div>
  );
}

// Show notification asking for selection
export function showStreamDeckAuthorizationNotification(
  challenge: number,
  promise: DeferredPromise
) {
  showNotification({
    title: `Elgato Stream Deck`,
    body: <StreamDeckChallenge challenge={challenge} />,
    type: 'progress',
    duration: 500,
    promise: promise.promise,
  });
}
