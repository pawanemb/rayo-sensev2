import { Metadata } from "next";
import ImagesList from "@/components/images/ImagesList";

export const metadata: Metadata = {
  title: "Images | Rayo Sense",
  description: "Manage and view all project images",
};

export default function ImagesPage() {
  return <ImagesList />;
}
