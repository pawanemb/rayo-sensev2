
import AiPlaygroundInterface from "@/components/ai-playground/AiPlaygroundInterface";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Playground | Rayo Sense",
  description: "Advanced AI interaction playground with robust fallback and parameter controls.",
};

export default function AiPlaygroundPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="AI Playground" />
      <div className="h-[calc(100vh-140px)]">
        <AiPlaygroundInterface />
      </div>
    </div>
  );
}
