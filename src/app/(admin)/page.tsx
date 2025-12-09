import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import BlogsGrowth from "@/components/dashboard/BlogsGrowth";
import ProjectGrowth from "@/components/dashboard/ProjectGrowth";
import ActiveUsers from "@/components/dashboard/ActiveUsers";

export const metadata: Metadata = {
  title:
    "Rayo Dashboard ",
  description: "This is Rayo ",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <ActiveUsers />
      </div>

      <div className="col-span-12">
        <BlogsGrowth />
      </div>

      <div className="col-span-12">
        <ProjectGrowth />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <RecentOrders />
      </div>
    </div>
  );
}
