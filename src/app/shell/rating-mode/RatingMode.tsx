import * as React from 'react';
import { t } from 'i18next';
import './RatingMode.scss';
import ClickOutside from '../../dim-ui/ClickOutside';
import { D2ManifestDefinitions, getDefinitions } from '../../destiny2/d2-definitions.service';
import { getReviewModes, D2ReviewMode } from '../../destinyTrackerApi/reviewModesFetcher';
import { D2StoresService } from '../../inventory/d2-stores.service';
import { reviewPlatformOptions } from '../../destinyTrackerApi/platformOptionsFetcher';
import { setSetting } from '../../settings/actions';
import store from '../../store/store';
import { connect } from 'react-redux';
import { RootState } from '../../store/reducers';
import { refresh } from '../refresh';
import { AppIcon, thumbsUpIcon } from '../icons';
import { dimCuratedRollService } from '../../curated-rolls/curatedRollService';
import { updateCurations } from '../../curated-rolls/actions';
import { settings } from '../../settings/settings';

interface StoreProps {
  reviewsModeSelection: number;
  platformSelection: number;
}

type Props = StoreProps;

interface State {
  open: boolean;
  defs?: D2ManifestDefinitions;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    reviewsModeSelection: state.settings.reviewsModeSelection,
    platformSelection: state.settings.reviewsPlatformSelection
  };
}

// TODO: observe Settings changes - changes in the reviews pane aren't reflected here without an app refresh.
class RatingMode extends React.Component<Props, State> {
  private dropdownToggler = React.createRef<HTMLElement>();
  private _reviewModeOptions?: D2ReviewMode[];

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  componentDidMount() {
    getDefinitions().then((defs) => this.setState({ defs }));
  }

  render() {
    const { open, defs } = this.state;
    const { reviewsModeSelection, platformSelection } = this.props;

    if (!defs) {
      return null;
    }

    return (
      <div>
        <span
          className="link"
          onClick={this.toggleDropdown}
          ref={this.dropdownToggler}
          title={t('DtrReview.RatingsOptions')}
        >
          <AppIcon icon={thumbsUpIcon} />
        </span>
        {open && (
          <ClickOutside onClickOutside={this.closeDropdown}>
            <div className="mode-popup">
              {settings.showReviews && (
                <div>
                  <div className="mode-row">
                    <div className="mode-column">
                      <label className="mode-label" htmlFor="reviewMode">
                        {t('DtrReview.ForGameMode')}
                      </label>
                    </div>
                    <div className="mode-column">
                      <select
                        name="reviewMode"
                        value={reviewsModeSelection}
                        onChange={this.modeChange}
                      >
                        {this.reviewModeOptions.map((r) => (
                          <option key={r.mode} value={r.mode}>
                            {r.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mode-row">
                    <div className="mode-column">
                      <label className="mode-label" htmlFor="reviewMode">
                        {t('DtrReview.ForPlatform')}
                      </label>
                    </div>
                    <div className="mode-column">
                      <select
                        name="platformSelection"
                        value={platformSelection}
                        onChange={this.platformChange}
                      >
                        {reviewPlatformOptions.map((r) => (
                          <option key={r.description} value={r.platform}>
                            {t(r.description)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {$featureFlags.curatedRolls && (
                <div className="mode-row">
                  <div className="mode-column">
                    <label className="mode-label" htmlFor="curatedRoll">
                      {t('CuratedRoll.Header')}
                    </label>
                  </div>
                  <div className="mode-column">
                    <a className="link" onClick={this.curatedRollClick}>
                      48klocs - PvE
                    </a>
                  </div>
                </div>
              )}
            </div>
          </ClickOutside>
        )}
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
  };

  private closeDropdown = (e?) => {
    if (!e || !this.dropdownToggler.current || !this.dropdownToggler.current.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  private modeChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newModeSelection = e.target.value;
    store.dispatch(setSetting('reviewsModeSelection', newModeSelection));
    D2StoresService.refreshRatingsData();
    refresh();
  };

  private platformChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newPlatformSelection = e.target.value;
    store.dispatch(setSetting('reviewsPlatformSelection', newPlatformSelection));
    D2StoresService.refreshRatingsData();
    refresh();
  };

  private curatedRollClick = (e?) => {
    if (!e || !e.target) {
      return;
    }

    dimCuratedRollService.selectCuratedRolls('/data/suggested_items.txt').then((dcr) => {
      const storeRolls = D2StoresService.getStores();
      const inventoryCuratedRolls = dcr.getInventoryCuratedRolls(storeRolls);

      const curationActionData = {
        curationEnabled: dcr.curationEnabled,
        inventoryCuratedRolls
      };

      store.dispatch(updateCurations(curationActionData));
      refresh();
    });
  };
}

export default connect<StoreProps>(mapStateToProps)(RatingMode);
