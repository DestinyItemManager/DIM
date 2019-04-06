import React from 'react';
import { t } from 'i18next';
import './RatingMode.scss';
import ClickOutside from '../../dim-ui/ClickOutside';
import { D2ReviewMode } from '../../destinyTrackerApi/reviewModesFetcher';
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
import HelpLink from '../../dim-ui/HelpLink';
import RatingsKey from '../../item-review/RatingsKey';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../../dim-ui/FileUpload';
import { reviewModesSelector } from '../../item-review/reducer';

interface StoreProps {
  reviewsModeSelection: number;
  platformSelection: number;
  showReviews: boolean;
  reviewModeOptions: D2ReviewMode[];
}

type Props = StoreProps;

interface State {
  open: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    reviewsModeSelection: state.settings.reviewsModeSelection,
    platformSelection: state.settings.reviewsPlatformSelection,
    showReviews: state.settings.showReviews,
    reviewModeOptions: reviewModesSelector(state)
  };
}

// TODO: observe Settings changes - changes in the reviews pane aren't reflected here without an app refresh.
class RatingMode extends React.Component<Props, State> {
  private dropdownToggler = React.createRef<HTMLElement>();

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  render() {
    const { open } = this.state;
    const { reviewsModeSelection, platformSelection, showReviews, reviewModeOptions } = this.props;

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
              {showReviews && (
                <>
                  <RatingsKey />
                  <div className="mode-row">
                    <label className="mode-label" htmlFor="reviewMode">
                      {t('DtrReview.ForGameMode')}
                    </label>
                  </div>
                  <div className="mode-row">
                    <select
                      name="reviewMode"
                      value={reviewsModeSelection}
                      onChange={this.modeChange}
                    >
                      {reviewModeOptions.map((r) => (
                        <option key={r.mode} value={r.mode}>
                          {r.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mode-row">
                    <label className="mode-label" htmlFor="reviewMode">
                      {t('DtrReview.ForPlatform')}
                    </label>
                  </div>
                  <div className="mode-row">
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
                </>
              )}

              {$featureFlags.curatedRolls && (
                <>
                  <div className="mode-row">
                    <label className="mode-label" htmlFor="curatedRoll">
                      {t('CuratedRoll.Header')}
                      <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
                    </label>
                  </div>
                  <div className="mode-row">
                    <FileUpload onDrop={this.loadCurations} title={t('CuratedRoll.Import')} />
                  </div>
                </>
              )}
            </div>
          </ClickOutside>
        )}
      </div>
    );
  }

  private toggleDropdown = () => {
    if (!this.state.open) {
      ga('send', 'event', 'Rating Options', 'Open');
    }
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
    ga('send', 'event', 'Rating Options', 'Change Mode');
  };

  private platformChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newPlatformSelection = e.target.value;
    store.dispatch(setSetting('reviewsPlatformSelection', newPlatformSelection));
    D2StoresService.refreshRatingsData();
    refresh();
    ga('send', 'event', 'Rating Options', 'Change Platform');
  };

  private loadCurations: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      // TODO: we're kinda trusting that this is the right data here, no validation!
      if (reader.result && typeof reader.result === 'string') {
        dimCuratedRollService.loadCuratedRolls(reader.result);
        ga('send', 'event', 'Rating Options', 'Load Ratings');

        if (dimCuratedRollService.getCuratedRolls()) {
          const storeRolls = D2StoresService.getStores();
          const inventoryCuratedRolls = dimCuratedRollService.getInventoryCuratedRolls(storeRolls);

          const curationActionData = {
            curationEnabled: dimCuratedRollService.curationEnabled,
            inventoryCuratedRolls
          };

          store.dispatch(updateCurations(curationActionData));
          refresh();
          alert(
            t('CuratedRoll.ImportSuccess', {
              count: dimCuratedRollService.getCuratedRolls().length
            })
          );
        } else {
          alert(t('CuratedRoll.ImportFailed'));
        }
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('CuratedRoll.ImportNoFile'));
    }
    return false;
  };
}

export default connect<StoreProps>(mapStateToProps)(RatingMode);
