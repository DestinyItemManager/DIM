import React, { useCallback, useEffect, useState, useRef } from 'react';
import { t } from 'app/i18next-t';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'app/store/types';
import { getNotes } from 'app/inventory/dim-item-info';
import { itemHashTagsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { DimItem } from 'app/inventory/item-types';
import { itemIsInstanced } from 'app/utils/item-utils';
import { setItemHashNote, setItemNote } from 'app/inventory/actions';
import { AppIcon, editIcon } from 'app/shell/icons';
import styles from './NotesArea.m.scss';
import clsx from 'clsx';

const maxLength = 120;

export default function NotesArea({
  item,
  minimal,
  className,
}: {
  item: DimItem;
  className?: string;
  minimal?: boolean;
}) {
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
    return (
      <div className={clsx(className, { [styles.minimal]: minimal })}>
        <NotesEditor notes={savedNotes} item={item} setNotesOpen={setNotesOpen} />
      </div>
    );
  }

  // show notes if they exist, and an "add" or "edit" prompt
  return (
    <div className={clsx(className, { [styles.minimal]: minimal })}>
      <div
        role="button"
        className={clsx(styles.openNotesEditor, { [styles.noNotesYet]: !savedNotes })}
        onClick={() => {
          setNotesOpen(true);
          ga('send', 'event', 'Item Popup', 'Edit Notes');
        }}
        tabIndex={0}
      >
        <AppIcon className={styles.editIcon} icon={editIcon} />{' '}
        <span className={savedNotes ? styles.notesLabel : styles.addNotesLabel}>
          {savedNotes ? t('MovePopup.Notes') : t('MovePopup.AddNote')}
        </span>{' '}
        {savedNotes}
      </div>
    </div>
  );
}

function NotesEditor({
  notes,
  item,
  setNotesOpen,
}: {
  notes?: string;
  item: DimItem;
  setNotesOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // track what's in the text field and warn people if it's too long
  const [liveNotes, setLiveNotes] = useState(notes ?? '');
  const onNotesUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLiveNotes(e.target.value);
  };

  // track the Text Area so we can get its contents once, at time of save,
  // without relying on the constantly refreshing liveNotes value
  const textArea = useRef<HTMLTextAreaElement>(null);
  // dispatch notes updates
  const dispatch = useDispatch();
  const saveNotes = useCallback(() => {
    const newNotes = textArea.current?.value.trim();
    dispatch(
      itemIsInstanced(item)
        ? setItemNote({ itemId: item.id, note: newNotes })
        : setItemHashNote({ itemHash: item.hash, note: newNotes })
    );
  }, [dispatch, item]);

  const stopEvents = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    // ESC - revert notes to initial value and then close (&save) them
    if (e.keyCode === 27) {
      textArea.current!.value = notes ?? '';
      setNotesOpen(false);
    }
    // ENTER - prevent creation of a newline then close (&save) notes
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      setNotesOpen(false);
    }
  };

  useEffect(() => saveNotes, [saveNotes]);

  return (
    <form name="notes">
      <textarea
        ref={textArea}
        name="data"
        autoFocus={true}
        placeholder={t('Notes.Help')}
        maxLength={maxLength}
        value={liveNotes}
        onChange={onNotesUpdated}
        onBlur={stopEvents}
        onKeyDown={onKeyDown}
        onTouchStart={stopEvents}
        onMouseDown={stopEvents}
      />
      {liveNotes && liveNotes.length > maxLength && (
        <span className="textarea-error">{t('Notes.Error')}</span>
      )}
    </form>
  );
}
