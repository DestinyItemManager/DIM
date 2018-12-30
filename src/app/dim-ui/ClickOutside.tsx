import * as React from 'react';
import { Subject } from 'rxjs/Subject';
import { Subscriptions } from '../rx-utils';

export const ClickOutsideContext = React.createContext(new Subject<React.MouseEvent>());

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  onClickOutside(event: React.MouseEvent): void;
}

/**
 * Component that fires an event if you click or tap outside of it.
 */
// TODO: Use a context in order to use the React event system everywhere
export default class ClickOutside extends React.Component<Props> {
  static contextType = ClickOutsideContext;
  context!: React.ContextType<typeof ClickOutsideContext>;
  private wrapperRef = React.createRef<HTMLDivElement>();
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(this.context.subscribe(this.handleClickOutside));
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
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
  private handleClickOutside = (event: React.MouseEvent) => {
    if (this.wrapperRef.current && !this.wrapperRef.current.contains(event.target as Node)) {
      this.props.onClickOutside(event);
    }
  };
}
