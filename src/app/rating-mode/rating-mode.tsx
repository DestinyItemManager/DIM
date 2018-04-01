import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import './rating-mode.scss';
import ClickOutside from '../dim-ui/click-outside';
import { settings } from '../settings/settings';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { $rootScope } from 'ngimport';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';

interface Props {
  defs: D2ManifestDefinitions;
  D2StoresService: StoreServiceType;
}

interface State {
  open: boolean;
  reviewsModeSelection: number;
}

// TODO: observe Settings changes - changes in the reviews pane aren't reflected here without an app refresh.
export default class RatingMode extends React.Component<Props, State> {
  private dropdownToggler: HTMLElement | null;

  private reviewModeOptions = getReviewModes(this.props.defs);

  constructor(props: Props) {
    super(props);
    this.state = { open: false, reviewsModeSelection: settings.reviewsModeSelection };
  }

  render() {
    const { open, reviewsModeSelection } = this.state;

    if (!this.props.defs) {
      return;
    }

    return (
      <div>
        <ClickOutside onClickOutside={this.closeDropdown}>
          <span className="link" onClick={this.toggleDropdown} title={t('DtrReview.ForGameMode')}>
            <i className={classNames('fa', 'fa fa-thumbs-up')}/>
          </span>
          {open &&
            <div className="mode-popup">
              <label className="mode-label" htmlFor="reviewMode">{t('DtrReview.ForGameMode')}</label>
              <select name="reviewMode" value={reviewsModeSelection} onChange={this.modeChange}>
                {this.reviewModeOptions.map((r) => <option key={r.mode} value={r.mode}>{r.description}</option>)}
              </select>
            </div>}
          </ClickOutside>
      </div>
    );
  }

  private toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  }

  private closeDropdown = (e?) => {
    if (!e || !this.dropdownToggler || !this.dropdownToggler.contains(e.target)) {
      this.setState({ open: false });
    }
  }

  private modeChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newModeSelection = e.target.value;
    settings.reviewsModeSelection = newModeSelection;
    settings.reviewsModeSelection = newModeSelection;
    this.props.D2StoresService.refreshRatingsData();
    this.setState({ reviewsModeSelection: newModeSelection });
    $rootScope.$broadcast('dim-refresh');
  }
}
