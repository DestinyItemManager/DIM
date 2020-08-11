import React, { useCallback, useEffect, useState } from 'react';
import { t } from 'app/i18next-t';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { getNotes } from 'app/inventory/dim-item-info';
import { itemHashTagsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { DimItem } from 'app/inventory/item-types';
import { itemIsInstanced } from 'app/utils/item-utils';
import { setItemHashNote, setItemNote } from 'app/inventory/actions';
import { AppIcon, editIcon } from 'app/shell/icons';
// import { RichNotes } from 'app/dim-ui/RichNotes';
import styles from './ItemDescription.m.scss';
import clsx from 'clsx';

const maxLength = 120;

export default function NotesArea({ item }: { item: DimItem }) {
  const savedNotes = useSelector<RootState, string>(
    (state) => getNotes(item, itemInfosSelector(state), itemHashTagsSelector(state)) ?? ''
  );
  const [notesOpen, setNotesOpen] = useState(false);

  // nothing to do if it can't be tagged (/noted)
  if (!item.taggable) {
    return null;
  }

  // text area for note editing
  if (notesOpen) {
    return <NotesEditor notes={savedNotes} item={item} />;
  }

  // show notes if they exist, and an "add" or "edit" prompt
  return (
    <div className={styles.description}>
      <div
        role="button"
        className={clsx(styles.addNote, { [styles.noNotesYet]: !savedNotes })}
        onClick={() => {
          setNotesOpen(true);
          ga('send', 'event', 'Item Popup', 'Edit Notes');
        }}
        tabIndex={0}
      >
        <AppIcon icon={editIcon} />{' '}
        <span className={styles.addNoteTag}>
          {savedNotes ? t('MovePopup.Notes') : t('MovePopup.AddNote')}
        </span>{' '}
        {savedNotes}
      </div>
    </div>
  );
}

function NotesEditor({ notes, item }: { notes?: string; item: DimItem }) {
  const [liveNotes, setLiveNotes] = useState(notes ?? '');
  const dispatch = useDispatch();
  const saveNotes = useCallback(() => {
    dispatch(
      itemIsInstanced(item)
        ? setItemNote({ itemId: item.id, note: liveNotes })
        : setItemHashNote({ itemHash: item.hash, note: liveNotes })
    );
  }, [dispatch, item, liveNotes]);

  const stopEvents = (e) => {
    e.stopPropagation();
  };
  const onNotesUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLiveNotes(e.target.value);
  };
  useEffect(() => saveNotes, [saveNotes]);

  return (
    <form name="notes">
      <textarea
        name="data"
        autoFocus={true}
        placeholder={t('Notes.Help')}
        maxLength={maxLength}
        value={liveNotes}
        onChange={onNotesUpdated}
        onBlur={saveNotes}
        onKeyDown={stopEvents}
        onTouchStart={stopEvents}
        onMouseDown={stopEvents}
      />
      {liveNotes && liveNotes.length > maxLength && (
        <span className="textarea-error">{t('Notes.Error')}</span>
      )}
    </form>
  );
}
