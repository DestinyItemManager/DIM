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

const maxLength = 120;

class NotesForm extends React.Component<Props> {
  render() {
    const { notes } = this.props;
    console.log('NOTES', notes);
    return (
      <form name="notes">
        <textarea
          name="data"
          placeholder={t('Notes.Help')}
          maxLength={maxLength}
          value={notes}
          onChange={this.onNotesUpdated}
        />
        {notes && notes.length > maxLength && (
          <span className="textarea-error">{t('Notes.Error')}</span>
        )}
      </form>
    );
  }

  private onNotesUpdated = (e) => {
    const notes = e.target.value as string;
    const info = this.props.item.dimInfo;
    if (info) {
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
