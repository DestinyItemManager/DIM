import { useLocalStorage } from './hooks';

const MAX_PARALLEL_CORES_KEY = 'maxParallelCores';

function getDefaultMaxParallelCores(): number {
  // Don't spin up a ton of threads for smaller problems, leave half the cores free
  return Math.max(1, Math.ceil((navigator.hardwareConcurrency || 1) / 2));
}

export function useMaxParallelCores(): [number, (value: number) => void] {
  return useLocalStorage(MAX_PARALLEL_CORES_KEY, getDefaultMaxParallelCores());
}

export function getMaxParallelCores(): number {
  try {
    const storedValue = window.localStorage.getItem(MAX_PARALLEL_CORES_KEY);
    return storedValue ? parseInt(storedValue, 10) : getDefaultMaxParallelCores();
  } catch {
    return getDefaultMaxParallelCores();
  }
}
