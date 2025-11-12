import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

// Cache for generated avatars to avoid regenerating the same avatar multiple times
const avatarCache = new Map<string, string>();

/**
 * Generates a DiceBear avatar SVG as a data URI with caching
 * Uses the 'adventurer' style for consistent, professional avatars
 */
export const generateDiceBearAvatar = (seed: string): string => {
  // Check cache first
  if (avatarCache.has(seed)) {
    return avatarCache.get(seed)!;
  }

  // Create avatar using DiceBear with the user's ID as seed
  const avatar = createAvatar(adventurer, {
    seed,
  });

  // Use built-in toDataUri method (more efficient than manual base64 encoding)
  const dataUri = avatar.toDataUri();

  // Cache the result
  avatarCache.set(seed, dataUri);

  // Limit cache size to prevent memory issues (keep last 1000 avatars)
  if (avatarCache.size > 1000) {
    const firstKey = avatarCache.keys().next().value;
    if (firstKey) {
      avatarCache.delete(firstKey);
    }
  }

  return dataUri;
};

/**
 * Gets the user's avatar URL from user_metadata or generates a fallback DiceBear avatar
 */
export const getUserAvatar = (userId: string, avatarUrl?: string | null): string => {
  return avatarUrl || generateDiceBearAvatar(userId);
};
