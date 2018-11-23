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
  opening: boolean;
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
  state: State = { closing: false, opening: true, dragging: false };
  private sheet = React.createRef<HTMLDivElement>();
  private sheetContents = React.createRef<HTMLDivElement>();
  private dragHandle = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // TODO: add body class?
    // TODO: set height for animate in
  }

  componentDidUpdate() {
    // This isn't great
    // TODO: not sure if this is right
    if (!this.state.height) {
      // Does this need to be in state?
      this.setState({ height: this.sheet.current!.clientHeight });
    } else if (this.state.opening) {
      this.setState({ opening: false });
    }
  }

  render() {
    const { dragging, closing, opening, height } = this.state;
    console.log({ ydelta: this.props.yDelta });

    const yDelta =
      (opening && height) || closing ? height : dragging ? Math.max(0, this.props.yDelta || 0) : 0;

    console.log('render', yDelta);

    // TODO: just use 100vh as the in/out height???
    return (
      <Spring
        native={true}
        immediate={opening}
        to={{ transform: opening && !height ? 'translateY(100vh)' : `translateY(${yDelta}px)` }}
        config={spring}
        onRest={this.onRest}
      >
        {(style) => (
          <animated.div
            style={style}
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
            <div className="sheet-contents" ref={this.sheetContents}>
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
    this.setState({ yDelta: this.state.height, closing: true });
  };

  private dragHandleDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      this.dragHandle.current!.contains(e.target as Node) ||
      this.sheetContents.current!.scrollTop === 0
    ) {
      console.log('dragging');
      this.setState({ dragging: true });
    } else {
      console.log('not dragging', e.currentTarget, e.target);
    }
  };
  private dragHandleUp = () => {
    console.log('dragHandleUp');
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
