import type { Metadata } from "next";
import { AuthorizedUsersList } from "@/components/authorized-users";

export const metadata: Metadata = {
  title: "Authorized Users | Rayo Sense",
  description: "Manage authorized users for the platform",
};

export default function AuthorizedUsersPage() {
  return (
    <section className="space-y-6">
      <AuthorizedUsersList />
    </section>
  );
}
