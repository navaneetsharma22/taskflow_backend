/**
 * Sanitizes user input before injecting into AI prompts
 * Prevents prompt injection, jailbreak attempts, and control character exploits
 */
const sanitizePromptInput = (input, maxLength = 500) => {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // 1. Strip control characters (except standard whitespace)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Collapse excessive whitespace
  sanitized = sanitized.replace(/\s{3,}/g, "  ");

  // 3. Escape quote characters to prevent prompt boundary manipulation
  sanitized = sanitized.replace(/"/g, '\\"');

  // 4. Strip common jailbreak/injection patterns
  sanitized = sanitized.replace(/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi, "[FILTERED]");
  sanitized = sanitized.replace(/system\s*prompt/gi, "[FILTERED]");
  sanitized = sanitized.replace(/you\s+are\s+now/gi, "[FILTERED]");
  sanitized = sanitized.replace(/act\s+as\s+(a\s+)?/gi, "[FILTERED]");
  sanitized = sanitized.replace(/pretend\s+(to\s+be|you\s+are)/gi, "[FILTERED]");

  // 5. Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + "...";
  }

  return sanitized.trim();
};

/**
 * Escapes special regex characters in user input to prevent ReDoS attacks
 */
const escapeRegex = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = { sanitizePromptInput, escapeRegex };
