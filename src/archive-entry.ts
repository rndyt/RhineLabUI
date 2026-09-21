/** The existing film's array reveal, stopping at the 0.4 preview lift. */
export const ARRAY_ENTRY_START = 21.9;
export const ARRAY_ENTRY_END = 26.56;
const ENTRY_RATE = 2;

export class ArchiveEntry {
  time: number;
  private last: number;
  constructor(currentTime: number, now: number) {
    this.time = Math.max(ARRAY_ENTRY_START, Math.min(ARRAY_ENTRY_END, currentTime));
    this.last = now;
  }
  advance(now: number) {
    if (now < this.last) return this.time;
    // Do not skip the reveal when a tab resumes or a frame takes too long.
    this.time = Math.min(ARRAY_ENTRY_END, this.time + Math.max(0, Math.min(.05, now - this.last)) * ENTRY_RATE);
    this.last = now;
    return this.time;
  }
  get finished() { return this.time >= ARRAY_ENTRY_END; }
}
