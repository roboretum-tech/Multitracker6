/**
 * Security & Input Sanitization Utilities for Capricorn Platform
 * Defends against XSS, Malicious Script Injection, CSV/Formula Injection, and unsafe URLs.
 */

// Safe protocol allowlist for external/internal links
const SAFE_URL_PROTOCOLS = ['https:', 'http:', 'mailto:'];

/**
 * Validates and sanitizes a URL.
 * Blocks dangerous schemes like `javascript:`, `data:`, `vbscript:`, `file:`.
 * Returns a safe URL string or '#' if invalid.
 */
export function sanitizeUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Relative URLs starting with '/' or '#' are generally safe
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.includes(parsed.protocol.toLowerCase())) {
      return parsed.toString();
    }
  } catch {
    // If it's a domain without protocol like "docs.google.com/...", prepend https://
    if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/i.test(trimmed)) {
      try {
        const withHttps = new URL(`https://${trimmed}`);
        if (SAFE_URL_PROTOCOLS.includes(withHttps.protocol.toLowerCase())) {
          return withHttps.toString();
        }
      } catch {
        // fall through
      }
    }
  }

  // Unsafe or unparseable protocol detected
  return '';
}

/**
 * Checks if a URL is safe to be rendered in an anchor tag.
 */
export function isSafeUrl(url: unknown): boolean {
  const sanitized = sanitizeUrl(url);
  return sanitized.length > 0 && !sanitized.startsWith('javascript:');
}

/**
 * Strips script tags, HTML tags, and inline event handlers (onerror, onclick, onload, etc.)
 * Prevents Cross-Site Scripting (XSS) in stored user text.
 */
export function sanitizeText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Strip script, iframe, object, embed tags with content
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  str = str.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  str = str.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // Strip any inline on* event handler attributes
  str = str.replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // Strip javascript: pseudo-protocols inside attributes
  str = str.replace(/javascript:[^\s"'>]*/gi, '');

  // Strip control characters except newline and tab
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return str.trim();
}

/**
 * Escapes HTML characters for safe rendering inside HTML contexts.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Neutralizes CSV Formula Injection (DDE / Excel Command Execution).
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', Excel or Google Sheets
 * may execute it as a formula or executable link upon opening.
 * Prefixing with a single quote "'" ensures it is treated strictly as plain text.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = value instanceof Date ? value.toLocaleString('es-ES') : String(value);

  // Check for dangerous leading characters
  const trimmed = str.trimStart();
  if (/^[=+\-@\t\r%]/.test(trimmed)) {
    str = `'${str}`;
  }

  // Escape double quotes
  str = str.replace(/"/g, '""');

  // Wrap in double quotes if it contains commas, quotes, or newlines
  if (/[",\n\r]/.test(str)) {
    str = `"${str}"`;
  }

  return str;
}

/**
 * Email validation regex following standard RFC 5322 subset.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Safe numeric parser with range boundaries.
 */
export function sanitizeNumber(value: unknown, fallback = 0, min?: number, max?: number): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}
