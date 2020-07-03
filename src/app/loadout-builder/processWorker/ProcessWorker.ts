import { expose } from 'comlink';
import { process } from './process';

const exports = {
  process,
};

export type ProcessWorker = typeof exports;

expose(exports);
