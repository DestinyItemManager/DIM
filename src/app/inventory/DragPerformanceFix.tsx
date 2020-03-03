import React from 'react';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import './DragPerformanceFix.scss';
import clsx from 'clsx';
import store from 'app/store/store';
import { itemDrag } from 'app/inventory/actions';

interface Props {
  isDragging: boolean;
}

function mapStateToProps(state: RootState) {
  return {
    isDragging: state.inventory.isDragging
  };
}

function hideOverlay() {
  // Rarely (possibly never in typical usage), a browser will forget to dispatch the dragEnd event
  // So we try not to trap the user here.
  store.dispatch(itemDrag(false));
}

/** This is a workaround for sluggish dragging in Chrome (and possibly other browsers) */
function DragPerformanceFix(props: Props) {
  return (
    <div
      className={clsx('drag-perf-fix', props.isDragging ? false : 'drag-perf-fix-hidden')}
      onClick={hideOverlay}
    />
  );
}

export default connect<Props>(mapStateToProps)(DragPerformanceFix);
