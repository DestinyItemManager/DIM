import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Tooltip from 'tooltip.js';
import './PressTip.scss';

interface Props {
  tooltip: React.ReactNode;
}

interface State {
  isOpen: boolean;
}

// TODO: Right now we have to wrap any content that's not a DOM node with a div so we get a real element. What's the real answer? React.forwardRef?
// TODO: defer rendering the tooltip?

/**
 * A "press tip" is a tooltip that can be shown by pressing on an element, or via hover.
 *
 * Tooltop content can be any React element, and can be updated through React.
 *
 * Example:
 *
 * <PressTip
 *   tooltip={
 *     <span>
 *       PressTip Content
 *     </span>
 *   }>
 *   <div>PressTip context element</div>
 * </PressTip>
 */
export default class PressTip extends React.Component<Props, State> {
  private tooltip?: Tooltip;
  private timer: number;
  private tooltipContent: Element;
  private ref: HTMLElement | null;

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  componentWillUnmount() {
    this.destroy();
  }

  showTip = () => {
    if (!this.ref) {
      return;
    }
    if (this.tooltip) {
      this.tooltip.show();
    } else {
      this.tooltip = new Tooltip(this.ref, {
        placement: 'top', // or bottom, left, right, and variations
        title: '...',
        html: true,
        trigger: 'manual',
        container: 'body'
      });
      this.tooltip.show();

      // Ugh this is a real hack
      this.tooltipContent = (this.tooltip as any)._tooltipNode.querySelector(
        (this.tooltip as any).innerSelector
      );
      this.tooltipContent.innerHTML = '';
    }
    this.setState({ isOpen: true });
  };

  closeToolTip = (e) => {
    e.preventDefault();
    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = undefined;
    }
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
    this.showTip();
  };

  captureReference = (ref: HTMLElement) => {
    if (ref === this.ref) {
      return;
    }

    this.destroy();

    this.ref = ref;

    if (ref) {
      ref.addEventListener('mouseenter', this.hover);
      ref.addEventListener('mousedown', this.press);
      ref.addEventListener('touchstart', this.press);
      ref.addEventListener('mouseup', this.closeToolTip);
      ref.addEventListener('mouseleave', this.closeToolTip);
      ref.addEventListener('touchend', this.closeToolTip);
    }
  };

  render() {
    const { tooltip, children } = this.props;
    const { isOpen } = this.state;

    if (!tooltip) {
      return children;
    }

    const element = React.Children.only(children);
    if (element.props.ref) {
      throw new Error(
        "You can't use the ref option with PressTip contents, because we steal it for ergonomics' sake"
      );
    }

    const otherProps = {
      ref: this.captureReference
    };

    return (
      <>
        <element.type {...element.props} {...otherProps} />
        {isOpen && ReactDOM.createPortal(tooltip, this.tooltipContent)}
      </>
    );
  }

  private destroy() {
    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = undefined;
    }
    if (this.ref) {
      this.ref.removeEventListener('mouseenter', this.hover);
      this.ref.removeEventListener('mousedown', this.press);
      this.ref.removeEventListener('touchstart', this.press);
      this.ref.removeEventListener('mouseup', this.closeToolTip);
      this.ref.removeEventListener('mouseleave', this.closeToolTip);
      this.ref.removeEventListener('touchend', this.closeToolTip);
      this.ref = null;
    }
  }
}
