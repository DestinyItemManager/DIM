import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  scrollClass: string;
}

export default class ScrollClassDiv extends React.PureComponent<Props> {
  private rafTimer: number;
  private ref = React.createRef<HTMLDivElement>();
  private scrollParent: HTMLElement | Document;

  componentDidMount() {
    this.scrollParent = document;
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
        ? document.body.scrollTop > 0 || document.documentElement?.scrollTop > 0
        : this.scrollParent.scrollTop > 0
    );
    if (this.ref.current) {
      this.ref.current.classList.toggle(this.props.scrollClass, scrolled);
    }
  };
}
