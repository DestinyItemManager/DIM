import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import ClickOutside from '../dim-ui/click-outside';

interface State {
  open: boolean;
}

export default class RatingMode extends React.Component<{}, State> {
  private dropdownToggler: HTMLElement | null;

  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  render() {
    const { open } = this.state;

    return (
      <div>
        <span className="link" onClick={this.toggleDropdown} title={t('DtrReview.ForGameMode')}>
          <i className={classNames('fa', 'fa fa-line-chart')}/>
        </span>
        {open &&
          <ClickOutside onClickOutside={this.closeDropdown}>
            <div>test</div>
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
}