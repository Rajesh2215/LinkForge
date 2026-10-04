import { redis } from '../lib/redis';

export class IdGeneratorService {
  private static readonly REDIS_KEY = 'linkforge:global_id_counter';
  // 'n' suffix denotes a JS BigInt literal (prevents precision loss & allows direct math with BigInt IDs)
  private static readonly RANGE_SIZE = 1000n; // Block size per server

  private currentId: bigint = 0n;
  private maxId: bigint = 0n;
  private isFetchingRange = false;

  /**
   * Optional: Offset the starting ID so codes start at 6 characters long
   * 62^5 = 916,132,832 -> Anything above this produces 6+ chars!
   */
  private static readonly INITIAL_OFFSET = 100_000_000n;

  /**
   * Requests a new block of IDs from Redis atomically.
   */
  private async fetchNewRange(): Promise<void> {
    // Atomic increment in Redis: returns the upper bound of the allocated range
    const newUpper = await redis.incrby(
      IdGeneratorService.REDIS_KEY,
      Number(IdGeneratorService.RANGE_SIZE)
    );

    const upperBound = BigInt(newUpper) + IdGeneratorService.INITIAL_OFFSET;
    this.maxId = upperBound;
    this.currentId = upperBound - IdGeneratorService.RANGE_SIZE + 1n;

    console.log(
      `🎫 [IdGenerator] Allocated new range: [${this.currentId} -> ${this.maxId}]`
    );
  }

  /**
   * Returns a globally unique 64-bit integer.
   * Completely thread-safe within Node's event loop.
   */
  async nextId(): Promise<bigint> {
    // If we've exhausted our current block or this is the first run
    while (this.currentId >= this.maxId) {
      if (!this.isFetchingRange) {
        this.isFetchingRange = true;
        try {
          await this.fetchNewRange();
        } finally {
          this.isFetchingRange = false;
        }
      } else {
        // Wait 10ms if another concurrent request is currently fetching
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    const assignedId = this.currentId;
    this.currentId += 1n;

    // NOTE (Option 2 - ID Obfuscation / Anti-Enumeration):
    // Currently, IDs increment sequentially. To prevent enumeration attacks (e.g., users guessing
    // consecutive short codes like /6LAzf, /6LAzg), we can pass assignedId through a reversible
    // bit-shuffle / Feistel cipher before Base62 encoding. This makes codes look completely random
    // while mathematically guaranteeing 0 collisions.
    return assignedId;
  }
}

export const idGenerator = new IdGeneratorService();
