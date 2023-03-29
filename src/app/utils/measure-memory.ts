// https://web.dev/monitor-total-page-memory-usage/

import { humanBytes } from 'app/storage/human-bytes';
import { infoLog } from './log';

export function scheduleMemoryMeasurement() {
  // Check measurement API is available.
  if (!window.crossOriginIsolated) {
    return;
  }
  if (!performance.measureUserAgentSpecificMemory) {
    return;
  }
  const interval = measurementInterval();
  setTimeout(performMeasurement, interval);
}

const MEAN_INTERVAL_IN_MS = 5 * 60 * 1000;
function measurementInterval() {
  return -Math.log(Math.random()) * MEAN_INTERVAL_IN_MS;
}

async function performMeasurement() {
  // 1. Invoke performance.measureUserAgentSpecificMemory().
  let result: MeasureMemoryResult;
  try {
    result = await performance.measureUserAgentSpecificMemory();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'SecurityError') {
      return;
    }
    // Rethrow other errors.
    throw error;
  }
  // 2. Record the result.
  infoLog(
    'memory',
    `DIM is using ${humanBytes(result.bytes)} of memory.`,
    result.breakdown
      .filter((b) => b.bytes)
      .map((b) => `${b.types.join('/')}: ${humanBytes(b.bytes)}`)
      .join(', ')
  );
  // 3. Schedule the next measurement.
  scheduleMemoryMeasurement();
}
