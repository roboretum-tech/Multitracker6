/**
 * Rate Limiting & Throttling Engine for Capricorn Platform
 * Limits requests and prevents brute-force, request flooding, and denial of service.
 */

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  /**
   * Evaluates if a request should be allowed under a sliding window rate limit.
   * @param key Unique identifier (e.g. 'auth:login:user@example.com', 'api:mutations', 'data:refresh')
   * @param maxRequests Maximum allowed requests in the time window
   * @param windowMs Time window in milliseconds
   * @param lockoutMs Optional penalty lockout time in ms if max is exceeded
   * @returns { allowed: boolean, remaining: number, retryAfterSeconds: number }
   */
  public check(
    key: string,
    maxRequests: number,
    windowMs: number,
    lockoutMs?: number
  ): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Check active lockout
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    } else if (record.blockedUntil && record.blockedUntil <= now) {
      // Lockout expired, reset timestamps
      record.blockedUntil = undefined;
      record.timestamps = [];
    }

    // Filter out timestamps outside the sliding window
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      if (lockoutMs) {
        record.blockedUntil = now + lockoutMs;
        const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds,
        };
      }

      const oldestTimestamp = record.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    const remaining = maxRequests - record.timestamps.length;
    return {
      allowed: true,
      remaining,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Records a consumed request attempt.
   */
  public hit(key: string): void {
    const now = Date.now();
    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }
    record.timestamps.push(now);
  }

  /**
   * Resets rate limit records for a given key (e.g. on successful login).
   */
  public reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Manually locks out a key for a given duration.
   */
  public block(key: string, durationMs: number): void {
    const record = this.records.get(key) || { timestamps: [] };
    record.blockedUntil = Date.now() + durationMs;
    this.records.set(key, record);
  }
}

export const globalRateLimiter = new RateLimiter();

// Pre-configured rate limits for key application boundaries
export const RATE_LIMIT_CONFIGS = {
  // Login: Max 5 failed attempts per 5 minutes; 60-second penalty lockout
  AUTH_LOGIN: {
    max: 5,
    windowMs: 5 * 60 * 1000,
    lockoutMs: 60 * 1000,
  },
  // Data Mutations (Create/Update/Delete): Max 40 per minute
  DATA_MUTATION: {
    max: 40,
    windowMs: 60 * 1000,
    lockoutMs: 15 * 1000,
  },
  // Data Refresh / Query: Max 30 per minute
  DATA_REFRESH: {
    max: 30,
    windowMs: 60 * 1000,
    lockoutMs: 10 * 1000,
  },
  // File Export: Max 6 exports per minute
  EXPORT: {
    max: 6,
    windowMs: 60 * 1000,
    lockoutMs: 20 * 1000,
  },
};

/**
 * Throttle helper for input search/filtering
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limitMs);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Debounce helper for input search/filtering
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delayMs);
  };
}
