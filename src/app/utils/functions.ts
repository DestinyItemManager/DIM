export function noop(): void {
  return;
}

export function stubTrue(): true {
  return true;
}

export function stubFalse(): false {
  return false;
}

export function identity<T>(value: T): T {
  return value;
}
