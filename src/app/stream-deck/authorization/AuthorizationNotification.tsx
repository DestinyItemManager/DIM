import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { DeferredPromise } from 'app/stream-deck/util/deferred';
import styles from './AuthorizationNotification.m.scss';

interface StreamDeckChallengeProps {
  challenge: number;
  onApprove?: () => void;
  onCancel?: () => void;
}

function StreamDeckChallenge({ challenge, onApprove, onCancel }: StreamDeckChallengeProps) {
  return (
    <div className={styles.authorization}>
      <span>{t('StreamDeck.Authorization.Title')}</span>
      <div className={styles.authorizationChallenge}>{challenge}</div>
      <div className={styles.authorizationButtons}>
        <button type="button" className="dim-button" onClick={onApprove}>
          {t('StreamDeck.Authorization.Yes')}
        </button>
        <button type="button" className="dim-button" onClick={onCancel}>
          {t('StreamDeck.Authorization.No')}
        </button>
      </div>
    </div>
  );
}

// Show notification asking for selection
export function showStreamDeckAuthorizationNotification(
  challenge: number,
  promise: DeferredPromise,
  onApprove?: () => void,
  onCancel?: () => void
) {
  showNotification({
    title: `Elgato Stream Deck`,
    body: <StreamDeckChallenge challenge={challenge} onApprove={onApprove} onCancel={onCancel} />,
    type: 'progress',
    duration: 500,
    promise: promise.promise,
  });
}
