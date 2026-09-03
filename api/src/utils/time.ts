
export function toISTString(date: Date = new Date()): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + istOffsetMs);
  return istTime.toISOString().replace("Z", "+05:30");
}