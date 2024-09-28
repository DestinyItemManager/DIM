import { WithSymbolsPicker } from 'app/dim-ui/destiny-symbols/SymbolsPicker';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { setNote } from 'app/inventory/actions';
import { DimItem } from 'app/inventory/item-types';
import { allNotesHashtagsSelector, notesSelector } from 'app/inventory/selectors';
import { AppIcon, editIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isiOSBrowser } from 'app/utils/browsers';
import clsx from 'clsx';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import styles from './NotesArea.m.scss';

export const maxLength = 1024;

export default function NotesArea({
  item,
  minimal,
  className,
}: {
  item: DimItem;
  className?: string;
  minimal?: boolean;
}) {
  const savedNotes = useSelector(notesSelector(item));
  const [notesOpen, setNotesOpen] = useState(false);
  const openNotes = useCallback(() => {
    setNotesOpen(true);
  }, []);

  useHotkey('n', t('Hotkey.Note'), openNotes);

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
        onClick={openNotes}
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
  const isPhonePortrait = useIsPhonePortrait();

  // track what's in the text field and warn people if it's too long
  const [liveNotes, setLiveNotes] = useState(notes ?? '');
  const onNotesUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setLiveNotes(e.target.value);

  // track the Text Area so we can get its contents once, at time of save,
  // without relying on the constantly refreshing liveNotes value
  const textArea = useRef<HTMLTextAreaElement>(null);
  // dispatch notes updates
  const dispatch = useThunkDispatch();
  const saveNotes = useCallback(() => {
    const newNotes = textArea.current?.value.trim();
    dispatch(setNote(item, newNotes));
  }, [dispatch, item]);

  const stopEvents = (e: React.SyntheticEvent) => e.stopPropagation();

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    // ESC - revert notes to initial value and then close (&save) them
    if (e.key === 'Escape') {
      textArea.current!.value = notes ?? '';
      setNotesOpen(false);
    }
    // ENTER - prevent creation of a newline then close (&save) notes
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setNotesOpen(false);
    }
  };

  // Save notes when component is unmounted
  // https://reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing
  useLayoutEffect(() => saveNotes, [saveNotes]);

  const onClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
  };

  const tags = useSelector(allNotesHashtagsSelector);
  useAutocomplete(textArea, tags);

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const nativeAutoFocus = !isPhonePortrait && !isiOSBrowser();

  return (
    <form name="notes">
      <WithSymbolsPicker input={textArea} setValue={(val) => setLiveNotes(val)}>
        <TextareaAutosize
          ref={textArea}
          name="data"
          autoFocus={nativeAutoFocus}
          placeholder={t('Notes.Help')}
          maxLength={maxLength}
          value={liveNotes}
          onClick={onClick}
          onChange={onNotesUpdated}
          onBlur={stopEvents}
          onKeyDown={onKeyDown}
          onPointerDown={stopEvents}
        />
      </WithSymbolsPicker>
      {liveNotes && liveNotes.length > maxLength && (
        <span className={styles.error}>{t('Notes.Error')}</span>
      )}
    </form>
  );
}
