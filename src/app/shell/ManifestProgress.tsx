import React, { useState } from 'react';
import { D1ManifestService } from '../manifest/d1-manifest-service';
import './ManifestProgress.scss';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { AppIcon, refreshIcon } from './icons';
import { D2ManifestService } from '../manifest/manifest-service-json';
import { useSubscription } from 'app/utils/hooks';

/**
 * A dialog that shows the progress of loading the manifest.
 */
export default function ManifestProgress({ destinyVersion }: { destinyVersion: number }) {
  const manifestService = destinyVersion === 2 ? D2ManifestService : D1ManifestService;

  const [manifestState, setManifestState] = useState(manifestService.state);
  useSubscription(() => manifestService.state$.subscribe(setManifestState));

  const { loaded, error, statusText } = manifestState;

  return (
    <TransitionGroup component={null}>
      {(!loaded || error) && statusText && (
        <CSSTransition clsx="manifest" timeout={{ enter: 300, exit: 300 }}>
          <div className="manifest-progress">
            {!error && <AppIcon icon={refreshIcon} spinning={true} />}
            <div> {statusText}</div>
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}
