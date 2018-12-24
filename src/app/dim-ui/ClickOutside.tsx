import * as React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  onClickOutside(event: Event): void;
}

/**
 * Component that fires an event if you click or tap outside of it.
 */
// TODO: Use a context in order to use the React event system everywhere
export default class ClickOutside extends React.Component<Props> {
  private wrapperRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside, false);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  render() {
    const { onClickOutside, ...other } = this.props;

    return (
      <div ref={this.wrapperRef} {...other}>
        {this.props.children}
      </div>
    );
  }

  /**
   * Alert if clicked on outside of element
   */
  private handleClickOutside = (event) => {
    if (this.wrapperRef.current && !this.wrapperRef.current.contains(event.target)) {
      this.props.onClickOutside(event);
    }
  };
}
