import { gaEvent } from 'app/google';
import Papa from 'papaparse';
import { maxOf } from './collections';
import { download } from './download';
import { errorLog } from './log';

type CsvPrimitive = string | number | boolean | undefined | null;
export type CsvValue = CsvPrimitive | CsvPrimitive[];
export type CsvRow = Record<string, CsvValue>;

export interface CsvExportOptions {
  /**
   * Unpack arrays behind these keys to Key 1, Key 2, ...
   * E.g. Perk -> Perk 1, Perk 2, ...
   */
  unpackArrays?: string[];
}

// only export for tests, because in JS the privacy boundary is the package...
export function serializeCsv(data: CsvRow[], exportOptions: CsvExportOptions): string {
  const columnSet = new Set<string>();

  const maxCountsByKey = Object.fromEntries(
    (exportOptions.unpackArrays ?? []).map(
      (key) =>
        [
          key,
          maxOf(data, (row) => {
            const val = row[key];
            if (Array.isArray(val)) {
              return val.length;
            }
            errorLog('csv export', `key ${key} is not an array in CSV export data`);
            return 0;
          }),
        ] as const,
    ),
  );

  const uniqueKeys = new Set(data.flatMap((row) => Object.keys(row)));
  for (const key of uniqueKeys) {
    const maxCount = maxCountsByKey[key];
    if (maxCount === undefined) {
      columnSet.add(key);
    } else {
      for (let i = 0; i < maxCount; i++) {
        columnSet.add(`${key} ${i}`);
      }
    }
  }

  data = [...data];

  for (let idx = 0; idx < data.length; idx++) {
    data[idx] = Object.fromEntries(
      Object.entries(data[idx]).flatMap(([key, value]): [string, CsvValue][] => {
        if (value === undefined || value === null) {
          return [];
        }
        if (maxCountsByKey[key] === undefined) {
          return [[key, value]] as const;
        } else if (!Array.isArray(value)) {
          const entryKey = `${key} 0`;
          return [[entryKey, value]] as const;
        } else {
          return value.map((val, idx) => {
            const entryKey = `${key} ${idx}`;
            return [entryKey, val] as const;
          });
        }
      }),
    );
  }

  return Papa.unparse(data, { columns: [...columnSet] });
}

export function downloadCsv(
  filename: string,
  data: CsvRow[],
  exportOptions: CsvExportOptions = {},
) {
  const filenameWithExt = `${filename}.csv`;
  const csv = serializeCsv(data, exportOptions);
  gaEvent('file_download', {
    file_name: filenameWithExt,
    file_extension: 'csv',
  });
  // TODO: Replace PapaParse with a simpler/smaller CSV generator
  download(csv, filenameWithExt, 'text/csv');
}
