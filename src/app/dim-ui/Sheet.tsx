import React from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { Spring, config, animated } from 'react-spring';
import { withGesture, GestureState } from 'react-with-gesture';
import clsx from 'clsx';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import _ from 'lodash';

interface Props {
  header?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  footer?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  children?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  sheetClassName?: string;
  onClose(): void;
}

interface State {
  closing: boolean;
  dragging: boolean;
}

// TODO: stop-points?

const spring = {
  ...config.stiff,
  clamp: true
};

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 0.8;
const dismissAmount = 0.5;

// Disable body scroll on mobile
const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
class Sheet extends React.Component<Props & GestureState> {
  state: State = { closing: false, dragging: false };
  private sheet = React.createRef<HTMLDivElement>();
  private sheetContents = React.createRef<HTMLDivElement>();
  private dragHandle = React.createRef<HTMLDivElement>();

  componentDidMount() {
    document.body.addEventListener('keyup', this.onKeyUp);
    if (this.sheetContents.current) {
      this.sheetContents.current.addEventListener('touchstart', this.blockEvents);
    }
    if (mobile) {
      enableBodyScroll(this.sheetContents.current);
      disableBodyScroll(this.sheetContents.current);
    }
  }

  componentDidUpdate() {
    if (this.sheetContents.current) {
      this.sheetContents.current.removeEventListener('touchstart', this.blockEvents);
      this.sheetContents.current.addEventListener('touchstart', this.blockEvents);
    }
    if (mobile) {
      enableBodyScroll(this.sheetContents.current);
      disableBodyScroll(this.sheetContents.current);
    }
  }

  componentWillUnmount() {
    if (this.sheetContents.current) {
      this.sheetContents.current.removeEventListener('touchstart', this.blockEvents);
    }
    document.body.removeEventListener('keyup', this.onKeyUp);
    if (mobile) {
      enableBodyScroll(this.sheetContents.current);
    }
  }

  render() {
    const { header, footer, children, sheetClassName, delta } = this.props;
    const { dragging, closing } = this.state;

    const yDelta = closing ? this.height() : dragging ? Math.max(0, delta ? delta[1] : 0) : 0;

    const windowHeight = window.innerHeight;
    const headerHeight = document.getElementById('header')!.clientHeight;
    const maxHeight = windowHeight - headerHeight - 16;

    return (
      <Spring
        native={true}
        from={{ transform: `translateY(${windowHeight}px)` }}
        to={{ transform: `translateY(${yDelta}px)` }}
        config={spring}
        onRest={this.onRest}
        immediate={dragging}
      >
        {(style) => (
          <animated.div
            style={{ ...style, maxHeight }}
            className={clsx('sheet', sheetClassName)}
            ref={this.sheet}
            onMouseDown={this.dragHandleDown}
            onMouseUp={this.dragHandleUp}
            onTouchStart={this.dragHandleDown}
            onTouchEnd={this.dragHandleUp}
            role="dialog"
            aria-modal="false"
          >
            <div className="sheet-close" onClick={this.onClose}>
              <AppIcon icon={disabledIcon} />
            </div>

            <div className="sheet-handle" ref={this.dragHandle}>
              <div />
            </div>

            <div className="sheet-container" style={{ maxHeight }}>
              {header && (
                <div className="sheet-header">
                  {_.isFunction(header) ? header({ onClose: this.onClose }) : header}
                </div>
              )}

              <div
                className={clsx('sheet-contents', { 'sheet-has-footer': footer })}
                ref={this.sheetContents}
              >
                {_.isFunction(children) ? children({ onClose: this.onClose }) : children}
              </div>

              {footer && (
                <div className="sheet-footer">
                  {_.isFunction(footer) ? footer({ onClose: this.onClose }) : footer}
                </div>
              )}
            </div>
          </animated.div>
        )}
      </Spring>
    );
  }

  private height = () => {
    return this.sheet.current!.clientHeight;
  };

  private onRest = () => {
    if (this.state.closing) {
      this.props.onClose();
    }
  };

  private onClose = () => {
    this.setState({ closing: true });
  };

  private dragHandleDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    // prevent item-tag-selector dropdown from triggering drag (Safari)
    if ((e.target as HTMLElement).classList.contains('item-tag-selector')) {
      return;
    }

    if (
      this.dragHandle.current!.contains(e.target as Node) ||
      this.sheetContents.current!.scrollTop === 0
    ) {
      this.setState({ dragging: true });
    }
  };

  private dragHandleUp = () => {
    const { delta, velocity, direction } = this.props;
    if (
      (delta ? delta[1] : 0) > (this.height() || 0) * dismissAmount ||
      (direction && velocity && direction[1] * velocity > dismissVelocity)
    ) {
      this.setState({ dragging: false, closing: true });
    } else {
      this.setState({ dragging: false });
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.onClose();
      return false;
    }
  };

  /** Block touch/click events for the inner scrolling area if it's not at the top. */
  private blockEvents = (e: TouchEvent | React.MouseEvent) => {
    if (this.sheetContents.current!.scrollTop !== 0) {
      e.stopPropagation();
    }
  };
}

export default withGesture({})(Sheet);
