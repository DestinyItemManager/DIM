export class HashLookupFailure extends Error {
  table: string;
  id: number;

  constructor(table: string, id: number) {
    super(`hashLookupFailure: ${table}[${id}]`);
    this.table = table;
    this.id = id;
    this.name = 'HashLookupFailure';
  }
}
