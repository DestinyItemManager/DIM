import * as React from 'react';

interface Props {
  className: string;
  scrollClass: string;
}

interface State {
  scrolled: boolean;
}

export default class ScrollClassDiv extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      scrolled: document.body.scrollTop > 0 || document.documentElement.scrollTop > 0
    };
  }
  componentDidMount() {
      document.addEventListener('scroll', this.scrollHandler, false);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.scrollHandler);
  }

  render() {
    const { className, scrollClass } = this.props;
    const { scrolled } = this.state;

    return (
      <div className={`${className} ${scrolled ? scrollClass : ''}`}>
        {this.props.children}
      </div>
    );
  }

  scrollHandler = () => {
    this.setState({ scrolled: document.body.scrollTop > 0 || document.documentElement.scrollTop > 0 });
  }
}
