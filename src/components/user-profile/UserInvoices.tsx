"use client";

import React from "react";

export default function UserInvoices() {
  const invoices = [
    { id: "INV-001", amount: "$299.00", status: "Paid", date: "Jan 1, 2025" },
    { id: "INV-002", amount: "$499.00", status: "Pending", date: "Dec 15, 2024" },
    { id: "INV-003", amount: "$199.00", status: "Paid", date: "Dec 1, 2024" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Invoices
      </h2>
      <div className="space-y-4">
        {invoices.map((invoice, index) => (
          <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.amount}</p>
              <span
                className={`text-xs ${
                  invoice.status === "Paid"
                    ? "text-success-600 dark:text-success-400"
                    : "text-warning-600 dark:text-warning-400"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
