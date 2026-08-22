import { expose } from 'comlink';
import { planForTargets } from './planner';

const exports = {
  planForTargets,
};

export type PlannerWorker = typeof exports;

expose(exports);
