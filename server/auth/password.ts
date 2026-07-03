import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Password hashing helpers using Node's built-in scrypt.
// Stored format: "scrypt:<hexSalt>:<hexHash>"

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt:";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}${salt}:${hash}`;
}

export function isHashedPassword(stored: string): boolean {
  return typeof stored === "string" && stored.startsWith(HASH_PREFIX);
}

// Returns true if the candidate password matches the stored value.
// Supports both scrypt hashes and legacy plaintext values (for lazy migration).
export function verifyPassword(password: string, stored: string): boolean {
  if (!isHashedPassword(stored)) {
    // Legacy plaintext record — constant-time compare via buffers of equal length.
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
