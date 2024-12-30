import { calculateElementOffset } from '@textcomplete/utils';
import { Option } from 'app/dim-ui/RadioButtons';
import { t } from 'app/i18next-t';
import { appendNote, removeFromNote, setNote } from 'app/inventory/actions';
import { DimItem } from 'app/inventory/item-types';
import { appendedToNote, removedFromNote } from 'app/inventory/note-hashtags';
import { allNotesHashtagsSelector, getNotesSelector } from 'app/inventory/selectors';
import { maxLength } from 'app/item-popup/NotesArea';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isWindows, isiOSBrowser } from 'app/utils/browsers';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { PressTipRoot } from './PressTip';
import { WithSymbolsPicker } from './destiny-symbols/SymbolsPicker';
import { useAutocomplete } from './text-complete/text-complete';
import styles from './useBulkNote.m.scss';
import useDialog, { Body, Buttons, Title } from './useDialog';

export interface BulkNoteResult {
  note: string;
  /**
   * 'replace' replaces the entire note with the new note.
   * 'append' adds the new note to the end of the existing note.
   * 'remove' removes any part of the note that matches the new note.
   */
  appendMode: 'replace' | 'append' | 'remove';
}

export default function useBulkNote(): [
  element: React.ReactNode,
  bulkNote: (items: DimItem[]) => Promise<void>,
] {
  const [dialog, showDialog] = useDialog<DimItem[], BulkNoteResult | null>((args, close) => (
    <BulkNoteDialog close={close} items={args} />
  ));

  const dispatch = useThunkDispatch();

  const bulkNote = useCallback(
    async (items: DimItem[]) => {
      const note = await showDialog(items);
      if (note !== null && items?.length) {
        for (const item of items) {
          switch (note.appendMode) {
            case 'replace':
              dispatch(setNote(item, note.note));
              break;
            case 'append': {
              dispatch(appendNote(item, note.note));
              break;
            }
            case 'remove':
              dispatch(removeFromNote(item, note.note));
              break;
          }
        }
      }
    },
    [dispatch, showDialog],
  );

  return [dialog, bulkNote];
}

function BulkNoteDialog({
  close,
  items,
}: {
  items: DimItem[];
  close: (result: BulkNoteResult | null) => void;
}) {
  const [note, setNote] = useState('');
  const [appendMode, setAppendMods] = useState<BulkNoteResult['appendMode']>('replace');

  const cancel = useCallback(() => close(null), [close]);
  const ok = useCallback(() => close({ note, appendMode }), [appendMode, close, note]);

  const okButton = (
    <button className="dim-button dim-button-primary" type="button" onClick={ok}>
      {t('BulkNote.Confirm')}
    </button>
  );

  const cancelButton = (
    <button className="dim-button" type="button" onClick={cancel}>
      {t('Dialog.Cancel')}
    </button>
  );

  const radioOptions: Option<BulkNoteResult['appendMode']>[] = [
    {
      value: 'replace',
      label: t('BulkNote.Replace'),
    },
    {
      value: 'append',
      label: t('BulkNote.Append'),
    },
    {
      value: 'remove',
      label: t('BulkNote.Remove'),
    },
  ];

  const getNote = useSelector(getNotesSelector);
  const exemplar = items.find((i) => i.taggable && getNote(i)) ?? items.find((i) => i.taggable);
  const originalNote = exemplar && getNote(exemplar);
  const updatedNote =
    appendMode === 'replace'
      ? note
      : appendMode === 'append'
        ? appendedToNote(originalNote, note)
        : removedFromNote(originalNote, note);

  return (
    <>
      <Title>
        <h2>{t('BulkNote.Title', { count: items.length })}</h2>
      </Title>
      <Body className={styles.body}>
        <NotesEditor notes={note} onNotesChanged={setNote} />
        <div className={styles.radios}>
          {radioOptions.map((o) => (
            <label key={o.value}>
              <input
                type="radio"
                name="appendmode"
                checked={appendMode === o.value}
                onChange={() => setAppendMods(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {exemplar && (
          <div className={styles.preview}>
            <div>Before:</div>
            <div>{originalNote}</div>
            <div>After:</div>
            <div>{updatedNote}</div>
          </div>
        )}
      </Body>
      <Buttons>
        {isWindows() ? (
          <>
            {cancelButton}
            {okButton}
          </>
        ) : (
          <>
            {okButton}
            {cancelButton}
          </>
        )}
      </Buttons>
    </>
  );
}

// TODO: Recombine with the one in NotesArea which has a lot of extra weird stuff
function NotesEditor({
  notes,
  onNotesChanged,
}: {
  notes: string;
  onNotesChanged: (notes: string) => void;
}) {
  const textArea = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const isPhonePortrait = useIsPhonePortrait();

  const tags = useSelector(allNotesHashtagsSelector);
  useAutocomplete(textArea, tags, form);

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const nativeAutoFocus = !isPhonePortrait && !isiOSBrowser();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    onNotesChanged(e.target.value);

  // This effect brute-force compensates for the fact that the textcomplete
  // library doesn't set its offset relative to its closest positioned parent,
  // but rather always from the document. It may be time to fork or replace the
  // textcomplete lib.
  useLayoutEffect(() => {
    if (!form.current) {
      return;
    }
    const offsets = calculateElementOffset(form.current);
    const dropdown = form.current.querySelector('.textcomplete-dropdown');
    if (dropdown && dropdown instanceof HTMLElement && dropdown.style.left) {
      dropdown.style.left = `${parseInt(dropdown.style.left, 10) - offsets.left}px`;
      dropdown.style.top = `${parseInt(dropdown.style.top, 10) - offsets.top}px`;
    }
  }, [notes]);

  return (
    <form name="notes" ref={form} className={styles.form}>
      <PressTipRoot value={form}>
        <WithSymbolsPicker input={textArea} setValue={(val) => onNotesChanged(val)}>
          <TextareaAutosize
            ref={textArea}
            name="data"
            placeholder={t('Notes.Help')}
            autoFocus={nativeAutoFocus}
            maxLength={maxLength}
            value={notes}
            onChange={handleChange}
          />
        </WithSymbolsPicker>
      </PressTipRoot>
    </form>
  );
}
