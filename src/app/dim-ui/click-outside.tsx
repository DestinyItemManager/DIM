import * as React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  onClickOutside(event: Event): void;
}

/**
 * Component that fires an event if you click or tap outside of it.
 */
export default class ClickOutside extends React.Component<Props> {
  private wrapperRef: Element;

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('touchstart', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('touchstart', this.handleClickOutside);
  }

  render() {
    const { onClickOutside, ...other } = this.props;

    return (
      <div ref={this.setWrapperRef} {...other}>
        {this.props.children}
      </div>
    );
  }

  /**
   * Alert if clicked on outside of element
   */
  private handleClickOutside = (event) => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      // TODO:
      /*
      // This fixes an event ordering bug in Safari that can cause closed dialogs to reopen
      $timeout(() => {
        scope.$apply(attr.dimClickAnywhereButHere);
      }, 150);
      */
      this.props.onClickOutside(event);
    }
  }

  /**
   * Set the wrapper ref
   */
  private setWrapperRef = (node: HTMLDivElement) => {
    this.wrapperRef = node;
  }
}
