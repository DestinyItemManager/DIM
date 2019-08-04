import React from 'react';
import { t } from 'app/i18next-t';
import './RatingMode.scss';
import ClickOutside from '../../dim-ui/ClickOutside';
import { D2ReviewMode } from '../../destinyTrackerApi/reviewModesFetcher';
import { D2StoresService } from '../../inventory/d2-stores.service';
import { reviewPlatformOptions } from '../../destinyTrackerApi/platformOptionsFetcher';
import { setSetting } from '../../settings/actions';
import { connect } from 'react-redux';
import { RootState } from '../../store/reducers';
import { refresh } from '../refresh';
import { AppIcon, thumbsUpIcon } from '../icons';
import { clearWishLists, loadWishLists } from '../../curated-rolls/actions';
import HelpLink from '../../dim-ui/HelpLink';
import RatingsKey from '../../item-review/RatingsKey';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../../dim-ui/FileUpload';
import { reviewModesSelector } from '../../item-review/reducer';
import { wishListsEnabledSelector, loadCurationsFromIndexedDB } from '../../curated-rolls/reducer';
import { loadCuratedRollsAndInfo } from '../../curated-rolls/curatedRollService';
import { CuratedRollsAndInfo } from 'app/curated-rolls/curatedRoll';

interface StoreProps {
  reviewsModeSelection: number;
  platformSelection: number;
  showReviews: boolean;
  reviewModeOptions: D2ReviewMode[];
  curationsEnabled: boolean;
}

const mapDispatchToProps = {
  clearCurationsAndInfo: clearWishLists,
  loadCurationsAndInfo: loadWishLists,
  setSetting,
  loadCurationsFromIndexedDB: loadCurationsFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

interface State {
  open: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    reviewsModeSelection: state.settings.reviewsModeSelection,
    platformSelection: state.settings.reviewsPlatformSelection,
    showReviews: state.settings.showReviews,
    reviewModeOptions: reviewModesSelector(state),
    curationsEnabled: wishListsEnabledSelector(state)
  };
}

function getTitleAndDescriptionDisplay(curatedRollsAndInfo: CuratedRollsAndInfo): string {
  if (!curatedRollsAndInfo.title && !curatedRollsAndInfo.description) {
    return '';
  }

  if (curatedRollsAndInfo.title && curatedRollsAndInfo.description) {
    return `\n${curatedRollsAndInfo.title}\n${curatedRollsAndInfo.description}`;
  }

  if (curatedRollsAndInfo.title) {
    return curatedRollsAndInfo.title;
  }

  return curatedRollsAndInfo.description!;
}

// TODO: observe Settings changes - changes in the reviews pane aren't reflected here without an app refresh.
class RatingMode extends React.Component<Props, State> {
  private dropdownToggler = React.createRef<HTMLAnchorElement>();

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  componentDidMount() {
    this.props.loadCurationsFromIndexedDB();
  }

  render() {
    const { open } = this.state;
    const {
      reviewsModeSelection,
      platformSelection,
      showReviews,
      reviewModeOptions,
      curationsEnabled,
      clearCurationsAndInfo
    } = this.props;

    return (
      <div>
        <a
          className="link"
          role="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={this.toggleDropdown}
          ref={this.dropdownToggler}
          title={t('DtrReview.RatingsOptions')}
        >
          <AppIcon icon={thumbsUpIcon} />
        </a>
        {open && (
          <ClickOutside onClickOutside={this.closeDropdown}>
            <div className="mode-popup" role="dialog" aria-modal="false">
              {showReviews && (
                <>
                  <RatingsKey />
                  <div className="mode-row">
                    <label className="mode-label" htmlFor="reviewMode">
                      {t('DtrReview.ForGameMode', { mode: '' })}
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
                  {curationsEnabled && (
                    <button className="dim-button" onClick={clearCurationsAndInfo}>
                      {t('CuratedRoll.Clear')}
                    </button>
                  )}
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
    this.props.setSetting('reviewsModeSelection', newModeSelection);
    D2StoresService.refreshRatingsData();
    refresh();
    ga('send', 'event', 'Rating Options', 'Change Game Mode');
  };

  private platformChange = (e?) => {
    if (!e || !e.target) {
      return;
    }

    const newPlatformSelection = e.target.value;
    this.props.setSetting('reviewsPlatformSelection', newPlatformSelection);
    D2StoresService.refreshRatingsData();
    refresh();
    ga('send', 'event', 'Rating Options', 'Change Platform');
  };

  private loadCurations: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const curatedRollsAndInfo = loadCuratedRollsAndInfo(reader.result);
        ga('send', 'event', 'Rating Options', 'Load Wish List');

        if (curatedRollsAndInfo.curatedRolls.length > 0) {
          this.props.loadCurationsAndInfo(curatedRollsAndInfo);

          const titleAndDescription = getTitleAndDescriptionDisplay(curatedRollsAndInfo);

          refresh();
          alert(
            t('CuratedRoll.ImportSuccess', {
              count: curatedRollsAndInfo.curatedRolls.length,
              titleAndDescription
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

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(RatingMode);
