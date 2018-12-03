import * as React from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { Spring, config, animated } from 'react-spring';
import { withGesture, GestureState } from 'react-with-gesture';

interface Props {
  header?: React.ReactNode;
  children?: React.ReactNode;
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
const dismissVelocity = 50;
const dismissAmount = 0.5;

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
class Sheet extends React.Component<Props & Partial<GestureState>> {
  state: State = { closing: false, dragging: false };
  private sheet = React.createRef<HTMLDivElement>();
  private sheetContents = React.createRef<HTMLDivElement>();
  private dragHandle = React.createRef<HTMLDivElement>();

  componentDidMount() {
    document.body.classList.add('sheet-open');
    document.body.addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    document.body.classList.remove('sheet-open');
    document.body.removeEventListener('keyup', this.onKeyUp);
  }

  render() {
    const { header, children } = this.props;
    const { dragging, closing } = this.state;

    const yDelta = closing ? this.height() : dragging ? Math.max(0, this.props.yDelta || 0) : 0;

    return (
      <Spring
        native={true}
        from={{ transform: `translateY(${window.innerHeight}px)` }}
        to={{ transform: `translateY(${yDelta}px)` }}
        config={spring}
        onRest={this.onRest}
        immediate={dragging}
      >
        {(style) => (
          <animated.div
            style={style}
            className="sheet"
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

            {header && <div className="sheet-header">{header}</div>}

            <div className="sheet-contents" ref={this.sheetContents}>
              {children}
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
    }
    this.setState({ dragging: false, yDelta: 0 });
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.onClose();
      return false;
    }
  };
}

export default withGesture(Sheet);
