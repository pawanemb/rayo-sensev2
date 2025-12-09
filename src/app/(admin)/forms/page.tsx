import type { Metadata } from "next";
import FormsTable from "@/components/forms/FormsTable";

export const metadata: Metadata = {
  title: "Form Submissions - Rayo Dashboard",
  description: "Manage website analysis form submissions",
};

export default function FormsPage() {
  return (
    <div className="w-full">
      <FormsTable />
    </div>
  );
}
