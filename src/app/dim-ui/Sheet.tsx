import * as React from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { Spring, config, animated } from 'react-spring';
import { withGesture, GestureState } from 'react-with-gesture';

interface Props {
  onClose(): void;
}

interface State {
  closing: boolean;
  dragging: boolean;
  height?: number;
}

// TODO: when open, add "sheet-open" to body and set overflow: hidden

// TODO: decide whether open/close is just based on render
// TODO: enable gesture handling of the entire thing when scrolled???

// TODO: stop-points?

// TODO: figure out how to animate in!

// TODO: use gesture on top level, use 'isDragging' state that is always triggered on drag handled

const spring = {
  ...config.stiff,
  clamp: true
};

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
class Sheet extends React.Component<Props & Partial<GestureState>> {
  state: State = { closing: false, dragging: false };
  private sheet = React.createRef<HTMLDivElement>();
  private sheetContents = React.createRef<HTMLDivElement>();
  private dragHandle = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // TODO: add body class?
    // TODO: set height for animate in
  }

  componentDidUpdate() {
    // TODO: not sure if this is right
    if (!this.state.height) {
      // Does this need to be in state?
      this.setState({ height: this.sheet.current!.clientHeight });
    }
  }

  render() {
    const { dragging, closing, height } = this.state;
    console.log({ ydelta: this.props.yDelta });

    const yDelta = closing ? height : dragging ? Math.max(0, this.props.yDelta || 0) : 0;

    // TODO: just use 100vh as the in/out height???
    return (
      <Spring
        native={true}
        from={{ transform: `translateY(100vh)` }}
        to={{ transform: `translateY(${yDelta}px)` }}
        config={spring}
        onRest={this.onRest}
      >
        {(springProps) => (
          <animated.div
            style={springProps}
            className="sheet"
            ref={this.sheet}
            onMouseDown={this.dragHandleDown}
            onMouseUp={this.dragHandleUp}
          >
            <div className="sheet-close" onClick={this.onClose}>
              <AppIcon icon={disabledIcon} />
            </div>

            <div className="sheet-handle" ref={this.dragHandle}>
              <div />
            </div>
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

  private dragHandleDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      this.dragHandle.current!.contains(e.currentTarget) ||
      this.sheetContents.current!.scrollTop === 0
    ) {
      this.setState({ dragging: true });
    }
  };
  private dragHandleUp = () => {
    if (
      (this.props.yDelta || 0) > (this.state.height || 0) / 2 ||
      (this.props.yVelocity || 0) > 100
    ) {
      this.setState({ dragging: false, yDelta: this.state.height, closing: true });
    }
    this.setState({ dragging: false, yDelta: 0 });
  };
}

export default withGesture(Sheet);
