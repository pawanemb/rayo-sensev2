import LogsPageClient from "@/components/logs/LogsPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scraper Logs | Rayo Sense",
  description: "Real-time monitoring of web scraping operations and system performance",
};

export default function LogsPage() {
  return <LogsPageClient />;
}
