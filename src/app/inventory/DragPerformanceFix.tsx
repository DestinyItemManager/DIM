import React from 'react';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import './DragPerformanceFix.scss';
import clsx from 'clsx';

interface Props {
  isDragging: boolean;
}

function mapStateToProps(state: RootState) {
  return {
    isDragging: state.inventory.isDragging
  };
}

/** This is a workaround for sluggish dragging in Chrome (and possibly other browsers) */
function DragPerformanceFix(props: Props) {
  return (
    <div className={clsx('drag-perf-fix', props.isDragging ? false : 'drag-perf-fix-hidden')} />
  );
}

export default connect<Props>(mapStateToProps)(DragPerformanceFix);
