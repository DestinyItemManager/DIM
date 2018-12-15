import * as React from 'react';
import { D1ManifestService, ManifestServiceState } from '../manifest/manifest-service';
import './ManifestProgress.scss';
import { Subscription } from 'rxjs/Subscription';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { AppIcon, refreshIcon } from './icons';
import { D2ManifestService } from '../manifest/manifest-service-json';

interface Props {
  destinyVersion: number;
}

/**
 * A dialog that shows the progress of loading the manifest.
 */
export default class ManifestProgress extends React.Component<Props, ManifestServiceState> {
  private subscription?: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = this.manifestService.state;
  }

  componentDidMount() {
    this.listenForUpdates();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.destinyVersion !== this.props.destinyVersion) {
      this.listenForUpdates();
    }
  }

  render() {
    const { loaded, error, statusText } = this.state;
    return (
      <TransitionGroup>
        {(!loaded || error) && statusText && (
          <CSSTransition classNames="manifest" timeout={{ enter: 300, exit: 300 }}>
            <div className="manifest-progress">
              {!error && <AppIcon icon={refreshIcon} spinning={true} />}
              <div> {statusText}</div>
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    );
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  private listenForUpdates() {
    this.unsubscribe();
    this.subscription = this.manifestService.state$.subscribe((state) => this.setState(state));
  }

  private unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private get manifestService() {
    return this.props.destinyVersion === 2 ? D2ManifestService : D1ManifestService;
  }
}
