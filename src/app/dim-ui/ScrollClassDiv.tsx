import * as React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  scrollClass: string;
}

export default class ScrollClassDiv extends React.PureComponent<Props> {
  private rafTimer: number;
  private ref = React.createRef<HTMLDivElement>();
  private scrollParent: HTMLElement | Document;

  constructor(props) {
    super(props);
    this.state = {
      scrolled:
        document.body.scrollTop > 0 ||
        (document.documentElement && document.documentElement.scrollTop > 0)
    };
  }
  componentDidMount() {
    this.scrollParent = scrollParent(this.ref.current);
    this.scrollParent.addEventListener('scroll', this.scrollHandler, false);
  }

  componentWillUnmount() {
    this.scrollParent.removeEventListener('scroll', this.scrollHandler);
  }

  render() {
    const { scrollClass, ...props } = this.props;

    return (
      <div ref={this.ref} {...props}>
        {this.props.children}
      </div>
    );
  }

  scrollHandler = () => {
    cancelAnimationFrame(this.rafTimer);
    this.rafTimer = requestAnimationFrame(this.stickyHeader);
  };

  stickyHeader = () => {
    const scrolled = Boolean(
      this.scrollParent instanceof Document
        ? document.body.scrollTop > 0 ||
            (document.documentElement && document.documentElement.scrollTop > 0)
        : this.scrollParent.scrollTop > 0
    );
    if (this.ref.current) {
      this.ref.current.classList.toggle(this.props.scrollClass, scrolled);
    }
  };
}

function scrollParent(node) {
  while (node && node instanceof HTMLElement) {
    const style = getComputedStyle(node, null);
    if (
      style.getPropertyValue('overflow').match(/(auto|scroll)/) ||
      style.getPropertyValue('overflow-y').match(/(auto|scroll)/)
    ) {
      return node;
    }
    node = node.parentNode;
  }

  return document;
}
