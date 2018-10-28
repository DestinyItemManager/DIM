import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';

interface Props {
  isDraggingStack: boolean;
  isHoveringStack: boolean;
}

interface State {
  shiftKeyDown: boolean;
}

function mapStateToProps(state: RootState) {
  return {
    isDraggingStack: state.inventory.isDraggingStack,
    isHoveringStack: state.inventory.isHoveringStack
  };
}

class StackableDragHelp extends React.Component<Props, State> {
  state: State = { shiftKeyDown: false };

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.isDraggingStack && this.props.isDraggingStack) {
      window.addEventListener('dragover', this.onDrag);
    } else if (prevProps.isDraggingStack && !this.props.isDraggingStack) {
      window.removeEventListener('dragover', this.onDrag);
    }
  }

  render() {
    const { isDraggingStack, isHoveringStack } = this.props;
    const { shiftKeyDown } = this.state;

    const classes = {
      'drag-help-hidden': !isDraggingStack,
      'drag-shift-activated': shiftKeyDown,
      'drag-dwell-activated': isHoveringStack
    };

    // TODO: CSS Transition group? would have to handle attach/detach
    return (
      <div id="drag-help" className={classNames('drag-help', classes)}>
        {t('Help.Drag')}
      </div>
    );
  }

  private onDrag = (e: DragEvent) => {
    if (e.shiftKey !== this.state.shiftKeyDown) {
      this.setState({ shiftKeyDown: e.shiftKey });
    }
  };
}

export default connect<Props>(mapStateToProps)(StackableDragHelp);
