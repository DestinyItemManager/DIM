import React from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState } from '../../store/reducers';
import { refresh } from '../refresh';
import { clearCurations, loadCurations } from '../../curated-rolls/actions';
import HelpLink from '../../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../../dim-ui/FileUpload';
import { curationsEnabledSelector, loadCurationsFromIndexedDB } from '../../curated-rolls/reducer';
import { loadCuratedRolls } from '../../curated-rolls/curatedRollService';

interface StoreProps {
  curationsEnabled: boolean;
  numCurations: number;
}

const mapDispatchToProps = {
  clearCurations,
  loadCurations,
  loadCurationsFromIndexedDB: loadCurationsFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    curationsEnabled: curationsEnabledSelector(state),
    numCurations: state.curations.curations.length
  };
}

class RatingMode extends React.Component<Props> {
  componentDidMount() {
    this.props.loadCurationsFromIndexedDB();
  }

  render() {
    const { curationsEnabled, clearCurations, numCurations } = this.props;

    return (
      <>
        <h2>
          {t('CuratedRoll.Header')}
          <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
        </h2>
        <section>
          {$featureFlags.curatedRolls && (
            <>
              <div className="setting">
                <FileUpload onDrop={this.loadCurations} title={t('CuratedRoll.Import')} />
              </div>
              {curationsEnabled && (
                <div className="setting horizontal">
                  <label>{t('CuratedRoll.Num', { count: numCurations })}</label>
                  <button className="dim-button" onClick={clearCurations}>
                    {t('CuratedRoll.Clear')}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </>
    );
  }

  private loadCurations: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const curatedRolls = loadCuratedRolls(reader.result);
        ga('send', 'event', 'Rating Options', 'Load Wish List');

        if (curatedRolls.length > 0) {
          this.props.loadCurations(curatedRolls);
          refresh();
          alert(
            t('CuratedRoll.ImportSuccess', {
              count: curatedRolls.length
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
