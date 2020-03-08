import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';

interface Props {
  item: DimItem;
  notes?: string;
  onSaveNotes(notes: string): void;
}

interface State {
  liveNotes: string;
}

const maxLength = 120;

export default class NotesForm extends React.Component<Props, State> {
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
          autoFocus={true}
          placeholder={t('Notes.Help')}
          maxLength={maxLength}
          value={liveNotes}
          onChange={this.onNotesUpdated}
          onBlur={this.saveNotes}
          onKeyDown={this.stopEvents}
          onTouchStart={this.stopEvents}
          onMouseDown={this.stopEvents}
        />
        {liveNotes && liveNotes.length > maxLength && (
          <span className="textarea-error">{t('Notes.Error')}</span>
        )}
      </form>
    );
  }

  private onNotesUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value;
    this.setState({ liveNotes: notes || '' });
  };

  private saveNotes = () => {
    const notes = this.state.liveNotes;
    this.props.onSaveNotes(notes);
  };

  private stopEvents = (e) => {
    e.stopPropagation();
  };
}
