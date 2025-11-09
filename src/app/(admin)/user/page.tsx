import type { Metadata } from "next";
import React from "react";
import { UserList } from "@/components/users";

export const metadata: Metadata = {
  title: "User Overview | Rayo Sense",
  description: "View and manage workspace members, plans, and statuses.",
};

export default function UserOverviewPage() {
  return (
    <section className="space-y-6">
      <UserList />
    </section>
  );
}
