import * as React from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { Spring, config, animated } from 'react-spring';
import { withGesture, GestureState, WithGestureProps } from 'react-with-gesture';

interface Props {
  onClose(): void;
}

interface State {
  yDelta: number;
  closing: boolean;
}

// TODO: when open, add "sheet-open" to body and set overflow: hidden

// TODO: decide whether open/close is just based on render
// TODO: enable gesture handling of the entire thing when scrolled???

// TODO: use gesture on top level, use 'isDragging' state that is always triggered on drag handled

const SheetHandle = withGesture(() => (
  <div className="sheet-handle">
    <div />
  </div>
));

const spring = {
  ...config.stiff,
  clamp: true
};

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
class Sheet extends React.Component<Props & Partial<GestureState>> {
  state: State = { yDelta: 0, closing: false };
  private sheet = React.createRef<HTMLDivElement>();
  private sheetContents = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // TODO: add body class?
    // TODO: set height for animate in
  }

  render() {
    console.log({ ydelta: this.props.yDelta });

    const yDelta =
      this.state.yDelta ||
      (this.sheetContents.current &&
        this.sheetContents.current!.scrollTop === 0 &&
        Math.max(0, this.props.yDelta || 0)) ||
      0;

    return (
      <Spring
        native
        to={{ transform: `translateY(${yDelta}px)` }}
        config={spring}
        onRest={this.onRest}
      >
        {(springProps) => (
          <animated.div style={springProps} className="sheet" ref={this.sheet}>
            <div className="sheet-close" onClick={this.onClose}>
              <AppIcon icon={disabledIcon} />
            </div>

            <SheetHandle onAction={this.onHandleDrag} />
            <div className="sheet-contents" onScroll={this.onScroll} ref={this.sheetContents}>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
              <div>This is content</div>
            </div>
          </animated.div>
        )}
      </Spring>
    );
  }

  private onRest = () => {
    if (this.state.closing) {
      this.props.onClose();
    }
  };

  private onClose = () => {
    this.setState({ yDelta: this.sheet.current!.clientHeight, closing: true });
  };

  private onScroll = () => {
    if (this.sheetContents.current!.scrollTop < 0) {
      this.setState({ yDelta: -this.sheetContents.current!.scrollTop });
    }
  };

  private onHandleDrag = (gestureState: GestureState) => {
    if (gestureState.down) {
      if (gestureState.yVelocity > 100) {
        this.onClose();
      } else {
        this.setState({ yDelta: Math.max(0, gestureState.yDelta) });
      }
    } else {
      if (gestureState.yDelta > this.sheet.current!.clientHeight / 2) {
        this.onClose();
      } else {
        this.setState({ yDelta: 0 });
      }
    }
  };
}

export default withGesture(Sheet);
