import type { Metadata } from "next";
import { AuthorizedUsersList } from "@/components/authorized-users";

export const metadata: Metadata = {
  title: "Schbang Users | Rayo Sense",
  description: "Manage Schbang users for the platform",
};

export default function AuthorizedUsersPage() {
  return (
    <section className="space-y-6">
      <AuthorizedUsersList />
    </section>
  );
}
