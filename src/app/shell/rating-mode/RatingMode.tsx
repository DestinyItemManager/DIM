import * as React from 'react';
import { t } from 'i18next';
import './RatingMode.scss';
import ClickOutside from '../../dim-ui/click-outside';
import { settings } from '../../settings/settings';
import { $rootScope } from 'ngimport';
import { D2ManifestDefinitions, getDefinitions } from '../../destiny2/d2-definitions.service';
import { getReviewModes, D2ReviewMode } from '../../destinyTrackerApi/reviewModesFetcher';
import { StoreServiceType } from '../../inventory/store-types';

interface Props {
  D2StoresService: StoreServiceType;
}

interface State {
  open: boolean;
  reviewsModeSelection: number;
  defs?: D2ManifestDefinitions;
}

// TODO: observe Settings changes - changes in the reviews pane aren't reflected here without an app refresh.
export default class RatingMode extends React.Component<Props, State> {
  private dropdownToggler = React.createRef<HTMLElement>();
  private _reviewModeOptions?: D2ReviewMode[];

  constructor(props: Props) {
    super(props);
    this.state = { open: false, reviewsModeSelection: settings.reviewsModeSelection };
  }

  componentDidMount() {
    getDefinitions().then((defs) => this.setState({ defs }));
  }

  render() {
    const { open, reviewsModeSelection, defs } = this.state;

    if (!defs) {
      return null;
    }

    return (
      <div>
          <span className="link" onClick={this.toggleDropdown} ref={this.dropdownToggler} title={t('DtrReview.ForGameMode')}>
            <i className='fa fa fa-thumbs-up'/>
          </span>
          {open &&
          <ClickOutside onClickOutside={this.closeDropdown}>
            <div className="mode-popup">
              <label className="mode-label" htmlFor="reviewMode">{t('DtrReview.ForGameMode')}</label>
              <select name="reviewMode" value={reviewsModeSelection} onChange={this.modeChange}>
                {this.reviewModeOptions.map((r) => <option key={r.mode} value={r.mode}>{r.description}</option>)}
              </select>
            </div>
          </ClickOutside>}
      </div>
    );
  }

  private get reviewModeOptions() {
    if (!this._reviewModeOptions) {
      this._reviewModeOptions = getReviewModes(this.state.defs);
    }
    return this._reviewModeOptions;
  }

  private toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  }

  private closeDropdown = (e?) => {
    if (!e || !this.dropdownToggler.current || !this.dropdownToggler.current.contains(e.target)) {
      this.setState({ open: false });
    }
  }

  private modeChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newModeSelection = e.target.value;
    settings.reviewsModeSelection = newModeSelection;
    this.props.D2StoresService.refreshRatingsData();
    this.setState({ reviewsModeSelection: newModeSelection });
    $rootScope.$broadcast('dim-refresh');
  }
}
