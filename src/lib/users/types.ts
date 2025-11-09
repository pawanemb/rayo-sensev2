import type { User } from "@supabase/supabase-js";

export type NormalizedUser = {
  id: string;
  name: string;
  email: string | undefined;
  role: string;
  plan: string;
  spend: string;
  lastActive: string;
  avatar: string;
  raw: User;
};
