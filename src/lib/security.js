/**
 * Security utilities for XSS prevention and input validation
 */

/**
 * Validates a URL and ensures it uses allowed protocols
 * @param {string} url - URL to validate
 * @param {string[]} allowedProtocols - Array of allowed protocols
 * @returns {boolean} - True if URL is valid and safe
 */
export const isValidUrl = (url, allowedProtocols = ['http:', 'https:']) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url.trim());
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Validates a phone number for tel: protocol
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Only allow digits, spaces, +, -, (, )
  return /^[+]?[\d\s\-()]+$/.test(phone.trim());
};

/**
 * Creates a safe href attribute
 * @param {string} url - URL to make safe
 * @param {string} fallback - Fallback URL if invalid
 * @returns {string} - Safe URL or fallback
 */
export const createSafeHref = (url, fallback = '#') => {
  return isValidUrl(url) ? url : fallback;
};

/**
 * Creates a safe tel: href
 * @param {string} phone - Phone number to validate
 * @param {string} fallback - Fallback URL if invalid
 * @returns {string} - Safe tel: URL or fallback
 */
export const createSafeTelHref = (phone, fallback = '#') => {
  return isValidPhone(phone) ? `tel:${phone.trim()}` : fallback;
};

/**
 * Sanitizes text to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>"'&]/g, '')  // Remove dangerous characters
    .replace(/\s+/g, ' ')      // Normalize spaces
    .trim();
};

/**
 * Validates and sanitizes a display name
 * @param {string} name - Name to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized name or fallback
 */
export const sanitizeDisplayName = (name, maxLength = 50) => {
  if (!name || typeof name !== 'string') return 'Jugador';
  
  return sanitizeText(name).substring(0, maxLength) || 'Jugador';
};