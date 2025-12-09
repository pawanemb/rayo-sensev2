"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { FaSync, FaFileExport, FaCheckCircle, FaTimesCircle, FaGlobe, FaClock, FaDatabase } from "react-icons/fa";
import { generateAvatar } from "@/utils/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  getDashboardSummary,
  getScrapeRequests,
  getErrorLogs,
  DashboardSummaryData,
  ScrapeRequest,
  ErrorLog,
} from "@/lib/logs/logsService";

type TabType = "scrape_requests" | "error_logs";

export default function LogsPageClient() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrapeRequestsLoading, setScrapeRequestsLoading] = useState(false);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [scrapeRequests, setScrapeRequests] = useState<ScrapeRequest[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("scrape_requests");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pagination states
  const [scrapeRequestsPage, setScrapeRequestsPage] = useState(1);
  const [scrapeRequestsTotal, setScrapeRequestsTotal] = useState(0);
  const [scrapeRequestsTotalPages, setScrapeRequestsTotalPages] = useState(0);
  const [errorLogsPage, setErrorLogsPage] = useState(1);
  const [errorLogsTotal, setErrorLogsTotal] = useState(0);
  const [errorLogsTotalPages, setErrorLogsTotalPages] = useState(0);


  const limit = 10;

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, scrapeRequestsData, errorLogsData] = await Promise.all([
        getDashboardSummary(),
        getScrapeRequests({ page: 1, limit }),
        getErrorLogs({ page: 1, limit }),
      ]);

      setSummary(summaryData);
      setScrapeRequests(scrapeRequestsData.data);
      setScrapeRequestsTotal(scrapeRequestsData.total);
      setScrapeRequestsTotalPages(scrapeRequestsData.totalPages);
      setErrorLogs(errorLogsData.data);
      setErrorLogsTotal(errorLogsData.total);
      setErrorLogsTotalPages(errorLogsData.totalPages);
    } catch (error) {
      console.error("Error fetching logs data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch scrape requests
  const fetchScrapeRequests = useCallback(async (page: number) => {
    setScrapeRequestsLoading(true);
    try {
      const data = await getScrapeRequests({ page, limit });
      setScrapeRequests(data.data);
      setScrapeRequestsTotal(data.total);
      setScrapeRequestsTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching scrape requests:", error);
    } finally {
      setScrapeRequestsLoading(false);
    }
  }, []);

  // Fetch error logs
  const fetchErrorLogs = useCallback(async (page: number) => {
    setErrorLogsLoading(true);
    try {
      const data = await getErrorLogs({ page, limit });
      setErrorLogs(data.data);
      setErrorLogsTotal(data.total);
      setErrorLogsTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching error logs:", error);
    } finally {
      setErrorLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handlePageChange = (page: number) => {
    if (activeTab === "scrape_requests") {
      setScrapeRequestsPage(page);
      fetchScrapeRequests(page);
    } else {
      setErrorLogsPage(page);
      fetchErrorLogs(page);
    }
  };

  const exportToCSV = (data: ScrapeRequest[] | ErrorLog[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify((row as unknown as Record<string, unknown>)[header] || "")).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: ScrapeRequest[] | ErrorLog[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "success" ? (
      <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
        Success
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
        Failed
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    return method === "fast" ? (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        Fast
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        Browser
      </span>
    );
  };

  const currentPage = activeTab === "scrape_requests" ? scrapeRequestsPage : errorLogsPage;
  const totalPages = activeTab === "scrape_requests" ? scrapeRequestsTotalPages : errorLogsTotalPages;
  const totalItems = activeTab === "scrape_requests" ? scrapeRequestsTotal : errorLogsTotal;
  const currentData = activeTab === "scrape_requests" ? scrapeRequests : errorLogs;

  const pageNumbers = (() => {
    const current = currentPage;
    const range = 2;
    const numbers: number[] = [];
    const start = Math.max(1, current - range);
    const end = Math.min(totalPages, current + range);
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    if (!numbers.includes(1)) {
      numbers.unshift(1);
    }
    if (!numbers.includes(totalPages) && totalPages > 1) {
      numbers.push(totalPages);
    }
    return [...new Set(numbers)].sort((a, b) => a - b);
  })();

  const rangeStart = totalItems
    ? (currentPage - 1) * limit + (currentData.length > 0 ? 1 : 0)
    : null;
  const rangeEnd = totalItems && rangeStart !== null ? Math.min(rangeStart + currentData.length - 1, totalItems) : null;

  const stats = summary ? [
    {
      label: "Total Scrapes",
      value: summary.total_scrapes.toLocaleString(),
      icon: <FaGlobe className="w-5 h-5" />,
      color: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Successful",
      value: summary.successful_scrapes.toLocaleString(),
      icon: <FaCheckCircle className="w-5 h-5" />,
      color: "bg-success-100 dark:bg-success-900/30",
      textColor: "text-success-600 dark:text-success-400",
    },
    {
      label: "Failed",
      value: summary.failed_scrapes.toLocaleString(),
      icon: <FaTimesCircle className="w-5 h-5" />,
      color: "bg-error-100 dark:bg-error-900/30",
      textColor: "text-error-600 dark:text-error-400",
    },
    {
      label: "Success Rate",
      value: `${summary.success_rate.toFixed(2)}%`,
      icon: <FaCheckCircle className="w-5 h-5" />,
      color: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Avg Duration",
      value: `${summary.avg_duration_sec.toFixed(2)}s`,
      icon: <FaClock className="w-5 h-5" />,
      color: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Cache Hit Rate",
      value: `${summary.cache_hit_rate.toFixed(2)}%`,
      icon: <FaDatabase className="w-5 h-5" />,
      color: "bg-cyan-100 dark:bg-cyan-900/30",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
  ] : [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scraper Monitoring Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Real-time monitoring of web scraping operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} size={12} />
            Refresh
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 rounded-full border border-success-200 bg-success-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success-700"
            >
              <FaFileExport size={12} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="p-2">
                  <button
                    onClick={() => {
                      exportToCSV(scrapeRequests, "scrape-requests");
                      setShowExportMenu(false);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Scrape Requests (CSV)
                  </button>
                  <button
                    onClick={() => {
                      exportToJSON(scrapeRequests, "scrape-requests");
                      setShowExportMenu(false);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Scrape Requests (JSON)
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV(errorLogs, "error-logs");
                      setShowExportMenu(false);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Error Logs (CSV)
                  </button>
                  <button
                    onClick={() => {
                      exportToJSON(errorLogs, "error-logs");
                      setShowExportMenu(false);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Error Logs (JSON)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-5 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              </div>
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl border border-gray-200 ${stat.color} p-1.5 shadow-sm dark:border-gray-800`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                    {stat.label}
                  </p>
                  <div className={`${stat.textColor} opacity-60`}>
                    {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })}
                  </div>
                </div>
                <p className={`text-base font-bold ${stat.textColor} leading-tight`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("scrape_requests")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "scrape_requests"
              ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Scrape Requests ({scrapeRequestsTotal})
        </button>
        <button
          onClick={() => setActiveTab("error_logs")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "error_logs"
              ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Error Logs ({errorLogsTotal})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            {activeTab === "scrape_requests" ? (
              <Table>
                <TableHeader className="border-b border-gray-100 text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                  <TableRow>
                    <TableCell className="px-2 py-1.5 w-[130px]">Timestamp</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[180px]">URL</TableCell>
                    <TableCell className="px-2 py-1.5 w-[110px]">Method/Status</TableCell>
                    <TableCell className="px-2 py-1.5 w-[90px]">Duration/Cache</TableCell>
                    <TableCell className="px-2 py-1.5 w-[50px]">Proxy</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">User</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">Project</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[140px]">Blog</TableCell>
                    <TableCell className="px-2 py-1.5 w-[70px]">Comment</TableCell>
                  </TableRow>
                </TableHeader>
                {loading || scrapeRequestsLoading ? (
                  <TableSkeleton rows={10} columns={9} variant="logs" />
                ) : (
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {scrapeRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="px-5 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                          No scrape requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scrapeRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                            {formatDateTime(request.timestamp)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <a
                              href={request.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                            >
                              <div className="relative h-3.5 w-3.5 overflow-hidden rounded flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(request.url || '')}&sz=16`}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <span className="truncate">
                                {request.url.length > 40 ? `${request.url.slice(0, 40)}...` : request.url}
                              </span>
                            </a>
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <div className="flex flex-col gap-0.5">
                              {getMethodBadge(request.method)}
                              {getStatusBadge(request.status)}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-600 dark:text-gray-300">
                                {request.duration_ms ? `${(request.duration_ms / 1000).toFixed(2)}s` : "—"}
                              </span>
                              {request.cache_hit && (
                                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30" title="Cache Hit">
                                  <svg className="h-2 w-2 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            {request.proxy_used ? (
                              request.proxy_success ? (
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30" title="Proxy Success">
                                  <svg className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30" title="Proxy Failed">
                                  <svg className="h-2.5 w-2.5 text-error-600 dark:text-error-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {request.user_details ? (
                              <a
                                href={`/user/${request.user_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                <div className="relative h-5 w-5 overflow-hidden rounded-full border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                  <Image
                                    src={request.user_details.avatar || generateAvatar(request.user_details.name)}
                                    alt={request.user_details.name}
                                    fill
                                    sizes="20px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                    {request.user_details.name}
                                  </p>
                                  <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                                    {request.user_details.email}
                                  </p>
                                </div>
                              </a>
                            ) : request.user_id ? (
                              <a
                                href={`/user/${request.user_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-mono text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                                title={`View user: ${request.user_id}`}
                              >
                                {request.user_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {request.project_details ? (
                              <a
                                href={`/projects/${request.project_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                <div className="relative h-5 w-5 overflow-hidden rounded border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(request.project_details.url || '')}&sz=32`}
                                    alt={request.project_details.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                    {request.project_details.name}
                                  </p>
                                  {request.project_details.url && (
                                    <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                                      {request.project_details.url.replace(/^https?:\/\//, '')}
                                    </p>
                                  )}
                                </div>
                              </a>
                            ) : request.project_id ? (
                              <a
                                href={`/projects/${request.project_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-mono text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                title={`View project: ${request.project_id}`}
                              >
                                {request.project_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {request.blog_details ? (
                              <a
                                href={`/blogs/${request.blog_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex flex-col gap-0.5 hover:opacity-80 transition-opacity"
                              >
                                <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                                  {request.blog_details.title}
                                </p>
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 w-fit">
                                  {request.blog_details.status}
                                </span>
                              </a>
                            ) : request.blog_id ? (
                              <a
                                href={`/blogs/${request.blog_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-mono text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                                title={`View blog: ${request.blog_id}`}
                              >
                                {request.blog_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {request.comments ? (
                              <span
                                className="inline-block rounded bg-pink-100 px-1.5 py-0.5 text-[9px] font-mono text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                                title="Comment ID"
                              >
                                {request.comments}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                )}
              </Table>
            ) : (
              <Table>
                <TableHeader className="border-b border-gray-100 text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                  <TableRow>
                    <TableCell className="px-2 py-1.5 w-[130px]">Timestamp</TableCell>
                    <TableCell className="px-2 py-1.5 w-[90px]">Error Type</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[180px]">Error Message</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">URL</TableCell>
                    <TableCell className="px-2 py-1.5 w-[70px]">Method</TableCell>
                    <TableCell className="px-2 py-1.5 w-[70px]">Frequency</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">User</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">Project</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[140px]">Blog</TableCell>
                    <TableCell className="px-2 py-1.5 w-[70px]">Comment</TableCell>
                  </TableRow>
                </TableHeader>
                {loading || errorLogsLoading ? (
                  <TableSkeleton rows={10} columns={10} variant="logs" />
                ) : (
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {errorLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="px-5 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                          No error logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      errorLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                            {formatDateTime(log.timestamp)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <span className="inline-flex items-center rounded-full bg-error-100 px-1.5 py-0.5 text-[9px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
                              {log.error_type}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px] text-gray-900 dark:text-gray-100">
                            {log.error_message.length > 40 ? `${log.error_message.slice(0, 40)}...` : log.error_message}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            {log.url ? (
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                              >
                                <div className="relative h-3.5 w-3.5 overflow-hidden rounded flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(log.url || '')}&sz=16`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <span className="truncate">
                                  {log.url.length > 30 ? `${log.url.slice(0, 30)}...` : log.url}
                                </span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            {getMethodBadge(log.method)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                            {log.frequency}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {log.user_details ? (
                              <a
                                href={`/user/${log.user_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                <div className="relative h-5 w-5 overflow-hidden rounded-full border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                  <Image
                                    src={log.user_details.avatar || generateAvatar(log.user_details.name)}
                                    alt={log.user_details.name}
                                    fill
                                    sizes="20px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                    {log.user_details.name}
                                  </p>
                                  <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                                    {log.user_details.email}
                                  </p>
                                </div>
                              </a>
                            ) : log.user_id ? (
                              <a
                                href={`/user/${log.user_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-mono text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                                title={`View user: ${log.user_id}`}
                              >
                                {log.user_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {log.project_details ? (
                              <a
                                href={`/projects/${log.project_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                <div className="relative h-5 w-5 overflow-hidden rounded border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(log.project_details.url || '')}&sz=32`}
                                    alt={log.project_details.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                    {log.project_details.name}
                                  </p>
                                  {log.project_details.url && (
                                    <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                                      {log.project_details.url.replace(/^https?:\/\//, '')}
                                    </p>
                                  )}
                                </div>
                              </a>
                            ) : log.project_id ? (
                              <a
                                href={`/projects/${log.project_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-mono text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                title={`View project: ${log.project_id}`}
                              >
                                {log.project_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {log.blog_details ? (
                              <a
                                href={`/blogs/${log.blog_details.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex flex-col gap-0.5 hover:opacity-80 transition-opacity"
                              >
                                <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                                  {log.blog_details.title}
                                </p>
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 w-fit">
                                  {log.blog_details.status}
                                </span>
                              </a>
                            ) : log.blog_id ? (
                              <a
                                href={`/blogs/${log.blog_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-mono text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                                title={`View blog: ${log.blog_id}`}
                              >
                                {log.blog_id.slice(0, 6)}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-[11px]">
                            {log.comments ? (
                              <span
                                className="inline-block rounded bg-pink-100 px-1.5 py-0.5 text-[9px] font-mono text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                                title="Comment ID"
                              >
                                {log.comments}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                )}
              </Table>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {rangeStart && rangeEnd && totalItems
              ? `Showing ${rangeStart}–${rangeEnd} of ${totalItems.toLocaleString()} ${activeTab === "scrape_requests" ? "requests" : "logs"}`
              : `Showing ${currentData.length} ${activeTab === "scrape_requests" ? "request" : "log"}${currentData.length !== 1 ? 's' : ''} on page ${currentPage}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Prev
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handlePageChange(num)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  num === currentPage
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                }`}
                disabled={num === currentPage}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
