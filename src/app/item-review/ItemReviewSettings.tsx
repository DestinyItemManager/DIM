import React from 'react';
import ExternalLink from '../dim-ui/ExternalLink';
import { AppIcon, helpIcon } from '../shell/icons';
import { t } from 'app/i18next-t';
import { DimItem } from '../inventory/item-types';
import { setSetting } from '../settings/actions';
import { getItemReviews } from './destiny-tracker.service';
import { connect } from 'react-redux';
import { ThunkDispatchProp } from 'app/store/types';

interface ProvidedProps {
  item: DimItem;
}

type Props = ProvidedProps & ThunkDispatchProp;

class ItemReviewSettings extends React.Component<Props> {
  render() {
    return (
      <form className="settings">
        <div className="review-setting-table">
          <div>
            <div className="review-setting-table--name">
              <label htmlFor="showReviews">{t('Settings.ShowReviews')}</label>
              <ExternalLink
                className="stylizedAnchor"
                aria-hidden="true"
                href="https://github.com/DestinyItemManager/DIM/blob/master/docs/RATINGS.md"
              >
                <AppIcon icon={helpIcon} />
              </ExternalLink>
            </div>
            <div className="review-setting-table--value">
              <input type="checkbox" name="showReviews" onChange={this.onChange} />
            </div>
          </div>
          <div>
            <div className="review-setting-table--name">
              <label htmlFor="allowIdPostToDtr">{t('Settings.AllowIdPostToDtr')}</label>
              <div>
                <label className="fineprint">{t('Settings.AllowIdPostToDtrLine2')}</label>
                <ExternalLink
                  className="stylizedAnchor"
                  aria-hidden="true"
                  href="https://github.com/DestinyItemManager/DIM/blob/master/docs/PRIVACY.md"
                >
                  <AppIcon icon={helpIcon} />
                </ExternalLink>
              </div>
            </div>
            <div className="review-setting-table--value">
              <input type="checkbox" name="allowIdPostToDtr" onChange={this.onChange} />
            </div>
          </div>
        </div>
      </form>
    );
  }

  private onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    const { item, dispatch } = this.props;

    const name = e.target.name as any;
    const val =
      isInputElement(e.target) && e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    dispatch(setSetting(name, val));

    if (name === 'allowIdPostToDtr') {
      dispatch(getItemReviews(item));
    }
  };
}

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}

export default connect()(ItemReviewSettings);
