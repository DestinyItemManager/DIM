import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import './rating-mode.scss';
import ClickOutside from '../dim-ui/click-outside';
import { settings } from '../settings/settings';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { $rootScope } from 'ngimport';

interface Props {
  D2StoresService: StoreServiceType;
}

interface State {
  open: boolean;
  reviewsModeSelection: number;
}

export default class RatingMode extends React.Component<Props, State> {
  private dropdownToggler: HTMLElement | null;

  private reviewModeOptions = [
    { key: 0, text: t('DtrReview.Modes.None') },
    { key: 7, text: t('DtrReview.Modes.AllPvE') },
    { key: 5, text: t('DtrReview.Modes.AllPvP') },
    { key: 4, text: t('DtrReview.Modes.Raid') },
    { key: 39, text: t('DtrReview.Modes.TrialsOfTheNine') }
  ];

  constructor(props: Props) {
    super(props);
    this.state = { open: false, reviewsModeSelection: settings.reviewsModeSelection };
  }

  render() {
    const { open, reviewsModeSelection } = this.state;

    return (
      <div>
        <span className="link" onClick={this.toggleDropdown} title={t('DtrReview.ForGameMode')}>
          <i className={classNames('fa', 'fa fa-thumbs-up')}/>
        </span>
        {open &&
          <ClickOutside onClickOutside={this.closeDropdown}>
            <div className="mode-popup">
              <label className="mode-label" htmlFor="reviewMode">{t('DtrReview.ForGameMode')}</label>
              <select name="reviewMode" value={reviewsModeSelection} onChange={this.modeChange}>
                {this.reviewModeOptions.map((r) => <option key={r.key} value={r.key}>{r.text}</option>)}
              </select>

            </div>
          </ClickOutside>}
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
