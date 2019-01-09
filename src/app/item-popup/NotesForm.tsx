import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import { getNotes } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { t } from 'i18next';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  notes?: string;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return { notes: getNotes(props.item, state.inventory.itemInfos) };
}

type Props = ProvidedProps & StoreProps;

interface State {
  liveNotes: string;
}

const maxLength = 120;

class NotesForm extends React.Component<Props, State> {
  state: State = { liveNotes: this.props.notes || '' };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.notes !== this.props.notes) {
      this.setState({ liveNotes: this.props.notes || '' });
    }
  }

  componentWillUnmount() {
    this.saveNotes();
  }

  render() {
    const { liveNotes } = this.state;
    return (
      <form name="notes">
        <textarea
          name="data"
          placeholder={t('Notes.Help')}
          maxLength={maxLength}
          value={liveNotes}
          onChange={this.onNotesUpdated}
          onBlur={this.saveNotes}
        />
        {liveNotes && liveNotes.length > maxLength && (
          <span className="textarea-error">{t('Notes.Error')}</span>
        )}
      </form>
    );
  }

  private onNotesUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value as string;
    this.setState({ liveNotes: notes || '' });
  };

  private saveNotes = () => {
    const notes = this.state.liveNotes;
    const info = this.props.item.dimInfo;
    if (info && info.notes !== notes) {
      if (notes.length) {
        info.notes = notes;
      } else {
        delete info.notes;
      }
      info.save!();
    }
  };
}

export default connect<StoreProps>(mapStateToProps)(NotesForm);
