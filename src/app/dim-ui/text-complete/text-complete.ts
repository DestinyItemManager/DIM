import { StrategyProps, Textcomplete } from '@textcomplete/core';
import { TextareaEditor } from '@textcomplete/textarea';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import clsx from 'clsx';
import { useEffect } from 'react';

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
      // commit a type crime here because textcomplete says it only works with
      // TextArea but happens to also work entirely fine with Input[type=text]
      // https://github.com/yuku/textcomplete/issues/355
      const editor = new TextareaEditor(textArea.current as unknown as HTMLTextAreaElement);
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
