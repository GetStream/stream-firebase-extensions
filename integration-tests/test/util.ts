export function expectRecent(date: Date, thresholdMs = 10000) {
  expect(Math.abs(new Date().getTime() - date.getTime())).toBeLessThan(thresholdMs);
}
