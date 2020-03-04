import React from 'react';
import { t } from 'app/i18next-t';
import { connect, DispatchProp } from 'react-redux';
import { RootState } from '../store/reducers';
import { clearWishLists } from '../wishlists/actions';
import HelpLink from '../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';
import { wishListsEnabledSelector, loadWishListAndInfoFromIndexedDB } from '../wishlists/reducer';
import _ from 'lodash';
import { setSetting } from './actions';
import { transformAndStoreWishList, fetchWishList } from 'app/wishlists/wishlist-fetch';
import { isUri } from 'valid-url';
import { toWishList } from 'app/wishlists/wishlist-file';
import { settingsSelector } from './reducer';

interface StoreProps {
  wishListsEnabled: boolean;
  numWishListRolls: number;
  title?: string;
  description?: string;
  wishListSource: string;
}

type Props = StoreProps & DispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    numWishListRolls: state.wishLists.wishListAndInfo.wishListRolls.length,
    title: state.wishLists.wishListAndInfo.title,
    description: state.wishLists.wishListAndInfo.description,
    wishListSource: settingsSelector(state).wishListSource
  };
}

interface State {
  wishListSource?: string;
}

class WishListSettings extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { wishListSource: props.wishListSource };
  }

  componentDidMount() {
    this.props.dispatch(loadWishListAndInfoFromIndexedDB() as any);
  }

  render() {
    const { wishListsEnabled, numWishListRolls, title, description } = this.props;
    const { wishListSource } = this.state;

    return (
      <section id="wishlist">
        <h2>
          {t('WishListRoll.Header')}
          <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
        </h2>
        {$featureFlags.wishLists && (
          <>
            <div className="setting">
              <FileUpload onDrop={this.loadWishList} title={t('WishListRoll.Import')} />
            </div>
            <div className="setting">
              <div>{t('WishListRoll.ExternalSource')}</div>
              <div>
                <input
                  type="text"
                  className="wish-list-text"
                  value={wishListSource}
                  onChange={this.updateWishListSourceState}
                  placeholder={t('WishListRoll.ExternalSource')}
                />
              </div>
              <div>
                <input
                  type="button"
                  className="dim-button"
                  value={t('WishListRoll.UpdateExternalSource')}
                  onClick={this.wishListUpdateEvent}
                />
              </div>
            </div>

            {wishListsEnabled && (
              <>
                <div className="setting">
                  <div className="horizontal">
                    <label>
                      {t('WishListRoll.Num', {
                        num: numWishListRolls
                      })}
                    </label>
                    <button className="dim-button" onClick={this.clearWishListEvent}>
                      {t('WishListRoll.Clear')}
                    </button>
                  </div>
                  {(title || description) && (
                    <div className="fineprint">
                      {title && (
                        <div className="overflow-dots">
                          <b>{title}</b>
                          <br />
                        </div>
                      )}
                      <div className="overflow-dots">{description}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    );
  }

  private wishListUpdateEvent = () => {
    const wishListSource = this.state.wishListSource?.trim();
    if (
      !isUri(wishListSource) ||
      !wishListSource?.startsWith('https://raw.githubusercontent.com/')
    ) {
      alert(t('WishListRoll.InvalidExternalSource'));
      return;
    }

    if (this.props.wishListSource === wishListSource) {
      return;
    }

    this.props.dispatch(setSetting('wishListSource', wishListSource));

    this.props.dispatch(fetchWishList() as any);

    ga('send', 'event', 'WishList', 'From URL');
  };

  private loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    this.props.dispatch(clearWishLists());
    this.setState({ wishListSource: '' });

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const wishListAndInfo = toWishList(reader.result);
        this.props.dispatch(transformAndStoreWishList(wishListAndInfo) as any);
        ga('send', 'event', 'WishList', 'From File');
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('WishListRoll.ImportNoFile'));
    }
    return false;
  };

  private clearWishListEvent = () => {
    ga('send', 'event', 'WishList', 'Clear');
    this.setState({ wishListSource: '' });
    this.props.dispatch(clearWishLists());
  };

  private updateWishListSourceState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSource = e.target.value;
    this.setState({ wishListSource: newSource });
  };
}

export default connect<StoreProps>(mapStateToProps)(WishListSettings);
