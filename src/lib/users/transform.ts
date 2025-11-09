import type { User } from "@supabase/supabase-js";
import type { NormalizedUser } from "./types";
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const formatCurrency = (value?: number | string) => {
  if (value === null || value === undefined) return "$0";
  const numeric = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(numeric)) return "$0";
  if (numeric >= 1000) {
    return `$${(numeric / 1000).toFixed(1)}k`;
  }
  return `$${numeric.toFixed(0)}`;
};

const formatLastActive = (iso?: string | null) => {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Cache for generated avatars to avoid regenerating the same avatar multiple times
const avatarCache = new Map<string, string>();

/**
 * Generates a DiceBear avatar SVG as a data URI with caching
 * Uses the 'adventurer' style for consistent, professional avatars
 */
const generateDiceBearAvatar = (seed: string): string => {
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

export const normalizeUser = (user: User): NormalizedUser => {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const role =
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    "member";

  const plan = user.user_metadata?.plan || "Free";
  const spend = formatCurrency(user.user_metadata?.lifetime_spend);

  // Generate avatar: use custom avatar_url if available, otherwise generate with DiceBear
  const avatar = user.user_metadata?.avatar_url || generateDiceBearAvatar(user.id || 'default');

  return {
    id: user.id,
    name,
    email: user.email,
    role,
    plan,
    spend,
    lastActive: formatLastActive(user.last_sign_in_at),
    avatar,
    raw: user,
  };
};
