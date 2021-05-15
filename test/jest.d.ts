export {};
declare global {
  namespace jest {
    interface Matchers<R> {
      toNearlyEqual(actual: Array<number>, precision?: number): R;
    }
  }
}
