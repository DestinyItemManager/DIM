import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { DeferredPromise } from 'app/stream-deck/util/deferred';
import './AuthorizationNotification.scss';

interface StreamDeckChallengeProps {
  challenge: number;
  onApprove?: () => void;
  onCancel?: () => void;
}

function StreamDeckChallenge({ challenge, onApprove, onCancel }: StreamDeckChallengeProps) {
  return (
    <div className="stream-deck-authorization">
      <span>{t('StreamDeck.Authorization.Title')}</span>
      <div className="stream-deck-challenge">{challenge}</div>
      <div className="stream-deck-authorization-buttons">
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
