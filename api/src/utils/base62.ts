
const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(CHARSET.length);

/**
 * Encodes a numeric ID into a Base62 string.
 * Example: 125 -> "21", 100000000 -> "6LAoW"
 */

export function encodeBase62(num: bigint | number): string {

  let n = BigInt(num)
  if (n === 0n) return CHARSET[0]

  let result = ''
  while (n > 0n) {
    const remainder = Number(n % BASE)
    result = CHARSET[remainder] + result
    n = n / BASE
  }
  return result
}

/**
 * Decodes a Base62 string back to its original numeric ID.
 */
export function decodeBase62(str: string): bigint {
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const index = CHARSET.indexOf(str[i]);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: ${str[i]}`);
    }
    result = result * BASE + BigInt(index);
  }
  return result;
}

export function generateShortCode(length: number = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    result += CHARSET[randomIndex];
  }
  return result;
}