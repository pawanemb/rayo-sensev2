import type { Metadata } from "next";
import React from "react";
import { BlogList } from "@/components/blogs";

export const metadata: Metadata = {
  title: "Blog Management | Rayo Sense",
  description: "View and manage all blog posts, their status, and analytics.",
};

export default function BlogsPage() {
  return (
    <section className="space-y-6">
      <BlogList />
    </section>
  );
}
