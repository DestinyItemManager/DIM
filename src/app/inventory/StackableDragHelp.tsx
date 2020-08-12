import React from 'react';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';

interface Props {
  isDraggingStack: boolean;
}

interface State {
  shiftKeyDown: boolean;
}

function mapStateToProps(state: RootState) {
  return {
    isDraggingStack: state.inventory.isDraggingStack,
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
    const { isDraggingStack } = this.props;
    const { shiftKeyDown } = this.state;

    const classes = {
      'drag-help-hidden': !isDraggingStack,
      'drag-shift-activated': shiftKeyDown,
    };

    // TODO: CSS Transition group? would have to handle attach/detach
    return (
      <div id="drag-help" className={clsx('drag-help', classes)} aria-hidden={!isDraggingStack}>
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
