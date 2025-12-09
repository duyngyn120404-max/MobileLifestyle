/**
 * Validation utilities for the MobileLifestyle app
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * - At least 6 characters
 * - At least one letter
 * - At least one number
 */
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 6) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
};

/**
 * Validate name (non-empty, no special chars)
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;
  if (!/^[a-zA-ZÀ-ỿ\s'-]+$/.test(name)) return false; // Allow Vietnamese chars
  return true;
};

/**
 * Validate health record value
 */
export const isValidHealthValue = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value >= 0;
};

/**
 * Validate date (not in future)
 */
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && date <= new Date();
};

/**
 * Validate session ID format
 */
export const isValidSessionId = (sessionId: string): boolean => {
  return sessionId && sessionId.length > 0;
};

/**
 * Get error message for validation failure
 */
export const getValidationError = (field: string, reason: string): string => {
  const messages: { [key: string]: { [key: string]: string } } = {
    email: {
      invalid: "Email không hợp lệ",
      required: "Email không được để trống",
    },
    password: {
      weak: "Mật khẩu phải có ít nhất 6 ký tự, 1 chữ cái và 1 số",
      required: "Mật khẩu không được để trống",
    },
    name: {
      invalid: "Tên không hợp lệ",
      required: "Tên không được để trống",
    },
    value: {
      invalid: "Giá trị không hợp lệ",
      required: "Giá trị không được để trống",
    },
  };

  return messages[field]?.[reason] || `${field} không hợp lệ`;
};
