import { t } from 'app/i18next-t';
import { SearchInput } from 'app/search/SearchInput';
import { tempContainer } from 'app/utils/temp-container';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import ClickOutside from '../ClickOutside';
import { PressTipRoot } from '../PressTip';
import { usePopper } from '../usePopper';
import ColorDestinySymbols from './ColorDestinySymbols';
import { symbolsSelector } from './destiny-symbols';
import styles from './SymbolsPicker.m.scss';

const symbolsIcon = String.fromCodePoint(FontGlyphs.gilded_title);

export default function SymbolsPicker<T extends HTMLTextAreaElement | HTMLInputElement>({
  input,
  setValue,
}: {
  input: React.RefObject<T>;
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
    setInsertionIndex(input.current?.selectionStart ?? null);
  }, [input]);

  useEffect(() => {
    const i = input.current;
    const listener = updateInsertionIndex;
    i?.addEventListener('blur', listener);
    return () => i?.removeEventListener('blur', listener);
  });

  const makePopup = () => (
    <ClickOutside onClickOutside={() => setOpen(false)}>
      <SymbolsWindow
        onChooseGlyph={(symbol) => {
          if (input.current) {
            const inputText = input.current.value;
            const insIndex = insertionIndex ?? inputText.length;
            setValue(inputText.slice(0, insIndex) + symbol + inputText.slice(insIndex));
            setInsertionIndex(insIndex + symbol.length);
          }
        }}
      />
    </ClickOutside>
  );

  return (
    <div className={styles.buttonDiv}>
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
        ReactDOM.createPortal(
          <div ref={tooltipContents}>{_.isFunction(makePopup) ? makePopup() : makePopup}</div>,
          pressTipRoot.current || tempContainer
        )}
    </div>
  );
}

function SymbolsWindow({ onChooseGlyph }: { onChooseGlyph: (unicode: string) => void }) {
  const allSymbols = useSelector(symbolsSelector);
  const emojis = Object.values(allSymbols).map(({ glyph, name, fullName }) => ({
    id: name,
    name: fullName,
    keyword: name,
    glyph,
  }));
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<typeof emojis[number] | undefined>(undefined);
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
            {emojis
              .filter((e) => e.keyword.includes(query) || e.name.includes(query))
              .map((emoji) => (
                <button
                  className={styles.emojiButton}
                  type="button"
                  key={emoji.glyph}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChooseGlyph(emoji.glyph);
                  }}
                  onMouseOver={() => setPreview(emoji)}
                >
                  {emoji.glyph}
                </button>
              ))}
          </div>
        </div>
        <div className={styles.symbolsFooter}>
          <ColorDestinySymbols text={preview?.glyph ?? symbolsIcon} />
          {preview && (
            <div>
              <span>{preview.name}</span>
              <span>:{preview.keyword}:</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
