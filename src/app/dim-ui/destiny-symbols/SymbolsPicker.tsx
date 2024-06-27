import { t } from 'app/i18next-t';
import { SearchInput } from 'app/search/SearchInput';
import { tempContainer } from 'app/utils/temp-container';
import clsx from 'clsx';
import { FontGlyphs } from 'data/font/d2-font-glyphs';
import React, {
  HTMLProps,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import ClickOutside from '../ClickOutside';
import { PressTipRoot } from '../PressTip';
import { usePopper } from '../usePopper';
import ColorDestinySymbols from './ColorDestinySymbols';
import styles from './SymbolsPicker.m.scss';
import { symbolsSelector } from './destiny-symbols';

const symbolsIcon = String.fromCodePoint(FontGlyphs.gilded_title);

/**
 * Decorate an <input> or <textarea> with an emoji picker button to pick Destiny symbols
 */
export function WithSymbolsPicker<T extends HTMLTextAreaElement | HTMLInputElement>({
  input,
  setValue,
  className,
  children,
}: {
  input: React.RefObject<T>;
  setValue: (val: string) => void;
  // NB no matter the type here TS/JSX cannot enforce that only a T is used here...
  children: React.ReactElement<HTMLProps<T>>;
  className?: string;
}) {
  return (
    <div className={clsx(className, styles.wrapperDiv)}>
      <>
        {children}
        <div className={styles.buttonDiv}>
          <SymbolsPickerButton input={input} setValue={setValue} />
        </div>
      </>
    </div>
  );
}

const SymbolsWindow = memo(function ({
  onChooseGlyph,
}: {
  onChooseGlyph: (unicode: string) => void;
}) {
  const allSymbols = useSelector(symbolsSelector);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<(typeof allSymbols)[number] | undefined>(undefined);
  return (
    <>
      {/* explicitly eat all click events so that clicking in the window doesn't dismiss the item popup */}
      <div className={styles.symbolsWindow} onClick={(e) => e.stopPropagation()}>
        <div className={styles.symbolsSearch}>
          <SearchInput
            query={query}
            onQueryChanged={setQuery}
            placeholder={t('Glyphs.SearchSymbols')}
          />
        </div>
        <div className={styles.symbolsBody}>
          <div className={styles.symbolsContainer}>
            {allSymbols.map(
              (emoji) =>
                (emoji.fullName.includes(query) || emoji.name.includes(query)) && (
                  <button
                    className={styles.emojiButton}
                    type="button"
                    key={emoji.glyph}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChooseGlyph(emoji.glyph);
                    }}
                    onPointerEnter={() => setPreview(emoji)}
                  >
                    {emoji.glyph}
                  </button>
                ),
            )}
          </div>
        </div>
        <div className={styles.symbolsFooter}>
          <ColorDestinySymbols text={preview?.glyph ?? symbolsIcon} />
          {preview && (
            <div>
              <span>{preview.fullName}</span>
              <span>:{preview.name}:</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

function SymbolsPickerButton<T extends HTMLTextAreaElement | HTMLInputElement>({
  input,
  setValue,
}: {
  input?: React.RefObject<T>;
  setValue: (val: string) => void;
}) {
  const controlRef = useRef<HTMLButtonElement>(null);
  const tooltipContents = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const pressTipRoot = useContext(PressTipRoot);

  usePopper({
    contents: tooltipContents,
    reference: controlRef,
    arrowClassName: '',
    placement: 'top',
  });

  // A user should be able to click multiple symbols to insert multiple symbols sequentially,
  // so we need to internally maintain where the cursor is (even when the element isn't actually focused)
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const updateInsertionIndex = useCallback(() => {
    setInsertionIndex(input?.current?.selectionStart ?? null);
  }, [input]);

  useEffect(() => {
    const i = input?.current;
    const listener = updateInsertionIndex;
    i?.addEventListener('blur', listener);
    return () => i?.removeEventListener('blur', listener);
  });

  const onChooseGlyph = useCallback(
    (symbol: string) => {
      const i = input?.current;
      if (i) {
        const inputText = i.value;
        const insIndex = insertionIndex ?? inputText.length;
        setValue(inputText.slice(0, insIndex) + symbol + inputText.slice(insIndex));
        setInsertionIndex(insIndex + symbol.length);
      }
    },
    [input, insertionIndex, setValue],
  );

  return (
    <>
      <button
        type="button"
        ref={controlRef}
        className={styles.symbolsButton}
        onClick={() => setOpen(!open)}
        title={t('Glyphs.OpenSymbolsPicker')}
      >
        <span>{symbolsIcon}</span>
      </button>
      {open &&
        createPortal(
          <div ref={tooltipContents}>
            <ClickOutside onClickOutside={() => setOpen(false)}>
              <SymbolsWindow onChooseGlyph={onChooseGlyph} />
            </ClickOutside>
          </div>,
          pressTipRoot.current ?? tempContainer,
        )}
    </>
  );
}
