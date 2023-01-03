import { createCustomEvent, CursorOffset, Editor, SearchResult } from '@textcomplete/core';
import { calculateElementOffset, getLineHeightPx } from '@textcomplete/utils';
import getCaretCoordinates from 'app/utils/textarea-caret';
import { update } from 'undate';

/**
 * An Editor for `textcomplete` so that we can show the completion dropdown
 * on <input type="text" /> elements too.
 */
export class InputTextEditor extends Editor {
  constructor(private readonly el: HTMLInputElement) {
    super();
    this.startListening();
  }

  destroy(): this {
    super.destroy();
    this.stopListening();
    return this;
  }

  /**
   * @implements {@link Editor#applySearchResult}
   */
  applySearchResult(searchResult: SearchResult): void {
    const beforeCursor = this.getBeforeCursor();
    if (beforeCursor !== null) {
      const replace = searchResult.replace(beforeCursor, this.getAfterCursor());
      this.el.focus(); // Clicking a dropdown item removes focus from the element.
      if (Array.isArray(replace)) {
        // Commit a type crime because the update code works with both input and textarea
        // even though the types don't advertise it
        update(this.el as any, replace[0], replace[1]);
        if (this.el) {
          this.el.dispatchEvent(createCustomEvent('input'));
        }
      }
    }
  }

  /**
   * @implements {@link Editor#getCursorOffset}
   */
  getCursorOffset(): CursorOffset {
    const elOffset = calculateElementOffset(this.el);
    const cursorPosition = getCaretCoordinates(this.el, this.el.selectionEnd ?? 0);
    const lineHeight = getLineHeightPx(this.el);
    const top = elOffset.top + lineHeight;
    const left = elOffset.left + cursorPosition.left;
    const clientTop = this.el.getBoundingClientRect().top;
    if (this.el.dir !== 'rtl') {
      return { top, left, lineHeight, clientTop };
    } else {
      const right = document.documentElement ? document.documentElement.clientWidth - left : 0;
      return { top, right, lineHeight, clientTop };
    }
  }

  /**
   * @implements {@link Editor#getBeforeCursor}
   */
  getBeforeCursor(): string | null {
    return this.el.selectionStart !== this.el.selectionEnd
      ? null
      : this.el.value.substring(0, this.el.selectionEnd ?? undefined);
  }

  private getAfterCursor(): string {
    return this.el.value.substring(this.el.selectionEnd ?? 0);
  }

  private onInput = () => {
    this.emitChangeEvent();
  };

  private onKeydown = (e: KeyboardEvent) => {
    const code = this.getCode(e);
    let event;
    if (code === 'UP' || code === 'DOWN') {
      event = this.emitMoveEvent(code);
    } else if (code === 'ENTER') {
      event = this.emitEnterEvent();
    } else if (code === 'ESC') {
      event = this.emitEscEvent();
    }
    if (event?.defaultPrevented) {
      e.preventDefault();
    }
  };

  private startListening(): void {
    this.el.addEventListener('input', this.onInput);
    this.el.addEventListener('keydown', this.onKeydown);
  }

  private stopListening(): void {
    this.el.removeEventListener('input', this.onInput);
    this.el.removeEventListener('keydown', this.onKeydown);
  }
}
