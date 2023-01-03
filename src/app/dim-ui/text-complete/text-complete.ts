import { StrategyProps, Textcomplete } from '@textcomplete/core';
import { TextareaEditor } from '@textcomplete/textarea';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import clsx from 'clsx';
import { useEffect } from 'react';
import { InputTextEditor } from './InputTextEditor';

import styles from './text-complete.m.scss';

function createTagsCompleter(
  textArea: React.RefObject<HTMLTextAreaElement | HTMLInputElement>,
  tags: string[]
): StrategyProps {
  return {
    match: /#(\w*)$/,
    search: (term, callback) => {
      const termLower = term.toLowerCase();
      // need to build this list from the element ref, because relying
      // on liveNotes state would re-instantiate Textcomplete every keystroke
      const existingTags = getHashtagsFromNote(textArea.current!.value).map((t) => t.toLowerCase());
      const possibleTags: string[] = [];
      for (const t of tags) {
        const tagLower = t.toLowerCase();
        // don't suggest duplicate tags
        if (existingTags.includes(tagLower)) {
          continue;
        }
        // favor startswith
        if (tagLower.startsWith('#' + termLower)) {
          possibleTags.unshift(t);
          // over full text search
        } else if (tagLower.includes(termLower)) {
          possibleTags.push(t);
        }
      }
      callback(possibleTags);
    },
    replace: (key) => `${key} `,
    // to-do: for major tags, gonna use this to show what the notes icon will change to
    // template: (key) => `<img src="${url}"/>&nbsp;<small>:${key}:</small>`,
  };
}

/**
 * Autocomplete a list of hashtags in this <textarea /> or <input type="text" />.
 * `tags` must have a stable object identity when using this hook (unless the set of tags changes).
 * selectors should ensure this, useMemo doesn't guarantee it per contract but works now.
 */
export function useAutocomplete(
  textArea: React.RefObject<HTMLTextAreaElement | HTMLInputElement>,
  tags: string[]
) {
  useEffect(() => {
    if (textArea.current) {
      const isInput = textArea.current instanceof HTMLInputElement;
      const editor = isInput
        ? new InputTextEditor(textArea.current)
        : new TextareaEditor(textArea.current);
      const textcomplete = new Textcomplete(editor, [createTagsCompleter(textArea, tags)], {
        dropdown: {
          className: clsx(styles.dropdownMenu, 'textcomplete-dropdown'),
        },
      });
      return () => {
        textcomplete.destroy();
      };
    }
  }, [tags, textArea]);
}
