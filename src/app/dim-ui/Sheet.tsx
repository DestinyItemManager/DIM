import * as React from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { Spring, config, animated } from 'react-spring';
import { withGesture, GestureState } from 'react-with-gesture';
import classNames from 'classnames';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import * as _ from 'lodash';

interface Props {
  header?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
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
const dismissVelocity = 5;
const dismissAmount = 0.3;

// Disable body scroll on mobile
const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
class Sheet extends React.Component<Props & Partial<GestureState>> {
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
    const { header, children, sheetClassName } = this.props;
    const { dragging, closing } = this.state;

    const yDelta = closing ? this.height() : dragging ? Math.max(0, this.props.yDelta || 0) : 0;

    const windowHeight = window.innerHeight;
    const maxHeight = windowHeight - 44 - 16;

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
            className={classNames('sheet', sheetClassName)}
            ref={this.sheet}
            onMouseDown={this.dragHandleDown}
            onMouseUp={this.dragHandleUp}
            onTouchStart={this.dragHandleDown}
            onTouchEnd={this.dragHandleUp}
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

              <div className="sheet-contents" ref={this.sheetContents}>
                {_.isFunction(children) ? children({ onClose: this.onClose }) : children}
              </div>
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
    this.setState({ yDelta: this.height(), closing: true });
  };

  private dragHandleDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (
      this.dragHandle.current!.contains(e.target as Node) ||
      this.sheetContents.current!.scrollTop === 0
    ) {
      this.setState({ dragging: true });
    }
  };

  private dragHandleUp = () => {
    if (
      (this.props.yDelta || 0) > (this.height() || 0) * dismissAmount ||
      (this.props.yVelocity || 0) > dismissVelocity
    ) {
      this.setState({ dragging: false, yDelta: this.height(), closing: true });
    } else {
      this.setState({ dragging: false, yDelta: 0 });
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

export default withGesture(Sheet);
