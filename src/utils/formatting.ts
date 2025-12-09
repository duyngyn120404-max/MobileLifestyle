/**
 * Formatting utilities for the MobileLifestyle app
 */

/**
 * Capitalize first letter of each word in a name
 * @example "john doe" -> "John Doe"
 */
export const capitalizeName = (name: string): string => {
  if (!name) return "User";
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Format date to Vietnamese locale
 * @example new Date() -> "09/12/2025"
 */
export const formatDateVN = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Format time to Vietnamese locale
 * @example new Date() -> "10:30"
 */
export const formatTimeVN = (date: Date): string => {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date and time together
 */
export const formatDateTimeVN = (date: Date): string => {
  return `${formatDateVN(date)} ${formatTimeVN(date)}`;
};

/**
 * Clean text for speech: remove emojis, markdown, special chars
 */
export const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F000}-\u{1F02F}]/gu, "") // Remove emojis
    .replace(/[*_`]/g, "") // Remove markdown
    .replace(/^[\s]*[•\-\*]\s+/gm, "") // Remove bullets
    .replace(/^#+\s+/gm, "") // Remove headers
    .replace(/\n/g, " ") // Replace newlines
    .trim()
    .replace(/\s+/g, " "); // Remove extra spaces
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

/**
 * Format number with Vietnamese formatting
 * @example 1234567 -> "1.234.567"
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("vi-VN");
};

/**
 * Format health value with unit
 * @example (120, "mmHg") -> "120 mmHg"
 */
export const formatHealthValue = (value: number, unit: string): string => {
  return `${value} ${unit}`;
};
