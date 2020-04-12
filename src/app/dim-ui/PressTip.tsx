import React from 'react';
import ReactDOM from 'react-dom';
import { popperGenerator, Instance, Options, Padding } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import applyStyles from '@popperjs/core/lib/modifiers/applyStyles';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import offset from '@popperjs/core/lib/modifiers/offset';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import styles from './PressTip.m.scss';
import _ from 'lodash';

interface Props {
  tooltip: React.ReactNode;
  children: React.ReactElement<any, any>;
  /** By default everything gets wrapped in a div, but you can choose a different element type here. */
  elementType?: React.ReactType;
}

interface State {
  isOpen: boolean;
}

/** Makes a custom popper that doesn't have the event listeners modifier */
const createPopper = popperGenerator({
  defaultModifiers: [
    popperOffsets,
    offset,
    computeStyles,
    applyStyles,
    flip,
    preventOverflow,
    arrow
  ]
});

const popperOptions = (): Partial<Options> => {
  const headerHeight = document.getElementById('header')!.clientHeight;
  const padding: Padding = {
    left: 0,
    top: headerHeight + 5,
    right: 0,
    bottom: 0
  };

  return {
    placement: 'top',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          priority: ['bottom', 'top', 'right', 'left'],
          boundariesElement: 'viewport',
          padding
        }
      },
      {
        name: 'flip',
        options: {
          behavior: ['top', 'bottom', 'right', 'left'],
          boundariesElement: 'viewport',
          padding
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, 5]
        }
      },
      {
        name: 'arrow',
        options: {
          element: '.' + styles.arrow
        }
      }
    ]
  };
};

/**
 * A "press tip" is a tooltip that can be shown by pressing on an element, or via hover.
 *
 * Tooltop content can be any React element, and can be updated through React.
 *
 * Example:
 *
 * <PressTip
 *   tooltip={() => (
 *     <span>
 *       PressTip Content
 *     </span>
 *   )}>
 *   PressTip context element
 * </PressTip>
 */
export default class PressTip extends React.Component<Props, State> {
  private popper?: Instance;
  private timer: number;
  private tooltipContents = React.createRef<HTMLDivElement>();
  private ref = React.createRef<HTMLDivElement>();

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  componentDidMount() {
    this.reposition();
  }

  componentWillUnmount() {
    this.destroy();
    clearTimeout(this.timer);
  }

  componentDidUpdate() {
    this.reposition();
  }

  showTip = () => {
    this.setState({ isOpen: true });
  };

  closeToolTip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isOpen: false });
    clearTimeout(this.timer);
  };

  hover = () => {
    this.timer = window.setTimeout(() => {
      this.showTip();
    }, 100);
  };

  press = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.showTip();
  };

  render() {
    const { tooltip, children } = this.props;
    const { isOpen } = this.state;

    if (!tooltip) {
      return <div>{children}</div>;
    }

    const Component = this.props.elementType ?? 'div';

    // TODO: if we reuse a stable tooltip container instance we could animate between them
    return (
      <Component
        ref={this.ref}
        onMouseEnter={this.hover}
        onMouseDown={this.press}
        onTouchStart={this.press}
        onMouseUp={this.closeToolTip}
        onMouseLeave={this.closeToolTip}
        onTouchEnd={this.closeToolTip}
      >
        {children}
        {isOpen &&
          ReactDOM.createPortal(
            <div className={styles.tooltip} ref={this.tooltipContents}>
              <div className={styles.content}>{_.isFunction(tooltip) ? tooltip() : tooltip}</div>
              <div className={styles.arrow} />
            </div>,
            document.body
          )}
      </Component>
    );
  }

  // Reposition the popup as it is shown or if its size changes
  private reposition = () => {
    if (this.state.isOpen) {
      if (!this.tooltipContents.current || !this.ref.current) {
        return;
      } else {
        if (this.popper) {
          this.popper.update();
        } else {
          const options = popperOptions();

          this.popper = createPopper(this.ref.current, this.tooltipContents.current, options);
          this.popper?.update();
          setTimeout(() => this.popper?.update(), 0); // helps fix arrow position
        }
      }
    } else {
      this.destroy();
    }
  };

  private destroy() {
    if (this.popper) {
      this.popper.destroy();
      this.popper = undefined;
    }
  }
}
