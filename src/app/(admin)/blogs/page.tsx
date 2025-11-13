import { Metadata } from "next";
import BlogsList from "@/components/blogs/BlogsList";

export const metadata: Metadata = {
  title: "Blogs | Rayo Sense Admin",
  description: "Manage and view all blogs in Rayo Sense",
};

export default function BlogsPage() {
  return <BlogsList />;
}
