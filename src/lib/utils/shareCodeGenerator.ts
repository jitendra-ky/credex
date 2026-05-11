/**
 * Share Code Generator
 * Single Responsibility: Generate unique, URL-safe share codes for audit sharing
 * 
 * Share codes are short alphanumeric strings used to create publicly accessible
 * audit URLs without exposing internal UUIDs.
 */

/**
 * Generate a random alphanumeric share code
 * 
 * @param length - Length of the share code (default: 8 characters)
 * @returns A URL-safe alphanumeric string
 * 
 * Uses uppercase and lowercase letters plus digits for good entropy.
 * 8 characters gives ~281 trillion possible combinations (62^8).
 * 
 * Example: "A7K9mX2p"
 */
function generateRandomCode(length: number = 8): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    code += charset[randomValues[i] % charset.length];
  }
  
  return code;
}

/**
 * Generate a unique share code
 * 
 * This function generates a new random share code each time it's called.
 * The caller (database layer) is responsible for checking uniqueness and
 * retrying if a collision occurs.
 * 
 * @returns A new random alphanumeric share code
 * 
 * @example
 * const shareCode = generateShareCode();
 * // Returns: "K9mX2pA7" (or similar)
 */
export function generateShareCode(): string {
  return generateRandomCode(8);
}

/**
 * Generate multiple share codes (for batch operations or testing)
 * 
 * @param count - Number of codes to generate
 * @returns Array of unique random share codes
 * 
 * Note: While each code is randomly generated, there's a theoretical
 * possibility of collision in large batches. For production batch inserts,
 * validate uniqueness against the database.
 */
export function generateShareCodes(count: number): string[] {
  const codes = new Set<string>();
  
  while (codes.size < count) {
    codes.add(generateRandomCode(8));
  }
  
  return Array.from(codes);
}
