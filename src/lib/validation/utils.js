import { z } from 'zod';

/**
 * Validation utilities and error handling
 */

/**
 * Validates data against a schema and returns parsed data or throws error
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {any} - Parsed and validated data
 * @throws {Error} - If validation fails
 */
export const validateWithSchema = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format error messages for better UX
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new Error(formattedErrors.map(e => `${e.field}: ${e.message}`).join(', '));
    }
    throw error;
  }
};

/**
 * Safely validates data and returns result object
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {object} - { success: boolean, data?: any, error?: string }
 */
export const safeValidate = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { 
        success: false, 
        error: formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Creates a form validation handler
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {function} onSuccess - Success callback
 * @param {function} onError - Error callback
 * @returns {function} - Validation handler function
 */
export const createFormValidator = (schema, onSuccess, onError) => {
  return (data) => {
    const result = safeValidate(schema, data);
    if (result.success) {
      onSuccess(result.data);
    } else {
      onError(result.error);
    }
  };
};

/**
 * Sanitizes and validates input text
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized text
 */
export const sanitizeInput = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>"'&]/g, '')  // Remove dangerous characters
    .replace(/\s+/g, ' ')      // Normalize spaces
    .trim()
    .substring(0, maxLength);
};