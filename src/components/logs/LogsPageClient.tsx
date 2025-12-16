"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { FaSync, FaFileExport, FaCheckCircle, FaTimesCircle, FaGlobe, FaClock, FaDatabase, FaPlus, FaSpider, FaLink, FaHourglassHalf, FaPlay } from "react-icons/fa";
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
  getCrawlTasks,
  getCrawlPages,
  getCrawlSummary,
  DashboardSummaryData,
  ScrapeRequest,
  ErrorLog,
  CrawlTask,
  CrawlPage,
  CrawlSummary,
} from "@/lib/logs/logsService";
import WebScraper from "@/components/developer/WebScraper";

type TabType = "scrape_requests" | "error_logs" | "crawl_tasks";

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
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ content: string; url: string } | null>(null);

  // Crawl tasks states
  const [crawlTasks, setCrawlTasks] = useState<CrawlTask[]>([]);
  const [crawlTasksLoading, setCrawlTasksLoading] = useState(false);
  const [crawlTasksPage, setCrawlTasksPage] = useState(1);
  const [crawlTasksTotal, setCrawlTasksTotal] = useState(0);
  const [crawlTasksTotalPages, setCrawlTasksTotalPages] = useState(0);
  const [crawlSummary, setCrawlSummary] = useState<CrawlSummary | null>(null);
  const [selectedTask, setSelectedTask] = useState<CrawlTask | null>(null);
  const [crawlPages, setCrawlPages] = useState<CrawlPage[]>([]);
  const [crawlPagesLoading, setCrawlPagesLoading] = useState(false);
  const [crawlPagesPage, setCrawlPagesPage] = useState(1);
  const [crawlPagesTotal, setCrawlPagesTotal] = useState(0);
  const [crawlPagesTotalPages, setCrawlPagesTotalPages] = useState(0);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ content: string; url: string; title: string } | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

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

  // Fetch crawl tasks
  const fetchCrawlTasks = useCallback(async (page: number, silent = false) => {
    if (!silent) setCrawlTasksLoading(true);
    try {
      const [tasksData, summaryData] = await Promise.all([
        getCrawlTasks({ page, limit }),
        getCrawlSummary()
      ]);
      setCrawlTasks(tasksData.data);
      setCrawlTasksTotal(tasksData.total);
      setCrawlTasksTotalPages(tasksData.totalPages);
      setCrawlSummary(summaryData);
    } catch (error) {
      console.error("Error fetching crawl tasks:", error);
    } finally {
      if (!silent) setCrawlTasksLoading(false);
    }
  }, []);

  // Fetch crawl pages for a specific task
  const fetchCrawlPages = useCallback(async (taskId: string, page: number, silent = false) => {
    if (!silent) setCrawlPagesLoading(true);
    try {
      const data = await getCrawlPages({ page, limit, taskId });
      setCrawlPages(data.data);
      setCrawlPagesTotal(data.total);
      setCrawlPagesTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching crawl pages:", error);
    } finally {
      if (!silent) setCrawlPagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh for crawl tasks every 5 seconds
  useEffect(() => {
    if (activeTab !== "crawl_tasks" || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchCrawlTasks(crawlTasksPage, true);
      if (selectedTask) {
        fetchCrawlPages(selectedTask.id, crawlPagesPage, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, autoRefreshEnabled, crawlTasksPage, crawlPagesPage, selectedTask, fetchCrawlTasks, fetchCrawlPages]);

  // Fetch crawl data when switching to crawl tab
  useEffect(() => {
    if (activeTab === "crawl_tasks" && crawlTasks.length === 0) {
      fetchCrawlTasks(1);
    }
  }, [activeTab, crawlTasks.length, fetchCrawlTasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handlePageChange = (page: number) => {
    if (activeTab === "scrape_requests") {
      setScrapeRequestsPage(page);
      fetchScrapeRequests(page);
    } else if (activeTab === "error_logs") {
      setErrorLogsPage(page);
      fetchErrorLogs(page);
    } else if (activeTab === "crawl_tasks") {
      setCrawlTasksPage(page);
      fetchCrawlTasks(page);
    }
  };

  const handleCrawlPagesPageChange = (page: number) => {
    if (selectedTask) {
      setCrawlPagesPage(page);
      fetchCrawlPages(selectedTask.id, page);
    }
  };

  const handleTaskSelect = (task: CrawlTask) => {
    setSelectedTask(task);
    setCrawlPagesPage(1);
    fetchCrawlPages(task.id, 1);
  };

  const handleViewContent = (content: string, url: string, title: string) => {
    setSelectedContent({ content, url, title });
    setShowContentModal(true);
  };

  const getCrawlStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <FaHourglassHalf className="w-2.5 h-2.5" />
            Pending
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse">
            <FaPlay className="w-2.5 h-2.5" />
            Running
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
            <FaCheckCircle className="w-2.5 h-2.5" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400">
            <FaTimesCircle className="w-2.5 h-2.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {status}
          </span>
        );
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

  const handleViewResponse = (content: string, url: string) => {
    setSelectedResponse({ content, url });
    setShowResponseModal(true);
  };

  const currentPage = activeTab === "scrape_requests" ? scrapeRequestsPage : activeTab === "error_logs" ? errorLogsPage : crawlTasksPage;
  const totalPages = activeTab === "scrape_requests" ? scrapeRequestsTotalPages : activeTab === "error_logs" ? errorLogsTotalPages : crawlTasksTotalPages;
  const totalItems = activeTab === "scrape_requests" ? scrapeRequestsTotal : activeTab === "error_logs" ? errorLogsTotal : crawlTasksTotal;
  const currentData = activeTab === "scrape_requests" ? scrapeRequests : activeTab === "error_logs" ? errorLogs : crawlTasks;

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
            onClick={() => setShowScrapeModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
          >
            <FaPlus size={12} />
            Manual Scrape
          </button>

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
        <button
          onClick={() => setActiveTab("crawl_tasks")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "crawl_tasks"
              ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <FaSpider className="w-3 h-3" />
          Crawl Tasks ({crawlTasksTotal})
          {crawlSummary && crawlSummary.running_tasks > 0 && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white animate-pulse">
              {crawlSummary.running_tasks}
            </span>
          )}
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
                    <TableCell className="px-2 py-1.5 w-[70px]">Response</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">User</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[160px]">Project</TableCell>
                    <TableCell className="px-2 py-1.5 min-w-[140px]">Blog</TableCell>
                    <TableCell className="px-2 py-1.5 w-[70px]">Comment</TableCell>
                  </TableRow>
                </TableHeader>
                {loading || scrapeRequestsLoading ? (
                  <TableSkeleton rows={10} columns={10} variant="logs" />
                ) : (
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {scrapeRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="px-5 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
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
                          <TableCell className="px-2 py-1.5">
                            {request.response_content && request.response_content.trim() ? (
                              <button
                                onClick={() => handleViewResponse(request.response_content, request.url)}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-[10px] font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
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
            ) : activeTab === "error_logs" ? (
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
            ) : activeTab === "crawl_tasks" ? (
              /* Crawl Tasks Content */
              <div className="p-4 space-y-4">
                {/* Crawl Summary Stats */}
                {crawlSummary && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 mb-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                        <FaSpider className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{crawlSummary.total_tasks}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/30">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Running</p>
                        <FaPlay className="w-3 h-3 text-blue-400 animate-pulse" />
                      </div>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{crawlSummary.running_tasks}</p>
                    </div>
                    <div className="rounded-lg border border-success-200 bg-success-50 p-2 dark:border-success-800 dark:bg-success-900/30">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-success-600 dark:text-success-400">Completed</p>
                        <FaCheckCircle className="w-3 h-3 text-success-400" />
                      </div>
                      <p className="text-lg font-bold text-success-700 dark:text-success-300">{crawlSummary.completed_tasks}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Pages Crawled</p>
                        <FaGlobe className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{crawlSummary.total_pages_crawled.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">URLs Found</p>
                        <FaLink className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{crawlSummary.total_urls_found.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Auto-refresh toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Auto-refresh every 5 seconds
                    </span>
                    <button
                      onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        autoRefreshEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          autoRefreshEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {selectedTask && (
                    <button
                      onClick={() => {
                        setSelectedTask(null);
                        setCrawlPages([]);
                      }}
                      className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Tasks
                    </button>
                  )}
                </div>

                {/* Crawl Tasks Table or Pages Table */}
                {!selectedTask ? (
                  /* Tasks List */
                  <Table>
                    <TableHeader className="border-b border-gray-100 text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                      <TableRow>
                        <TableCell className="px-2 py-1.5 w-[120px]">Created</TableCell>
                        <TableCell className="px-2 py-1.5 min-w-[200px]">Domain / Seed URL</TableCell>
                        <TableCell className="px-2 py-1.5 w-[80px]">Status</TableCell>
                        <TableCell className="px-2 py-1.5 w-[100px]">Progress</TableCell>
                        <TableCell className="px-2 py-1.5 w-[80px]">URLs</TableCell>
                        <TableCell className="px-2 py-1.5 w-[60px]">Proxy</TableCell>
                        <TableCell className="px-2 py-1.5 min-w-[140px]">User</TableCell>
                        <TableCell className="px-2 py-1.5 min-w-[140px]">Project</TableCell>
                        <TableCell className="px-2 py-1.5 w-[60px]">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    {crawlTasksLoading ? (
                      <TableSkeleton rows={10} columns={9} variant="logs" />
                    ) : (
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {crawlTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="px-5 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                              No crawl tasks found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          crawlTasks.map((task) => (
                            <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => handleTaskSelect(task)}>
                              <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                {formatDateTime(task.created_at)}
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                <div className="flex flex-col gap-0.5">
                                  <a
                                    href={`https://${task.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
                                  >
                                    <div className="relative h-3.5 w-3.5 overflow-hidden rounded flex-shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(task.domain)}&sz=16`}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    {task.domain}
                                  </a>
                                  <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                    {task.seed_url}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                {getCrawlStatusBadge(task.status)}
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-success-600 dark:text-success-400">{task.pages_crawled}</span>
                                    <span className="text-[10px] text-gray-400">/</span>
                                    <span className="text-[10px] text-error-600 dark:text-error-400">{task.pages_failed}</span>
                                  </div>
                                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-success-500 transition-all"
                                      style={{
                                        width: `${task.max_pages > 0 ? Math.min((task.pages_crawled / task.max_pages) * 100, 100) : 0}%`
                                      }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-gray-400">max: {task.max_pages}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                <div className="flex flex-col gap-0.5 text-[10px]">
                                  <span className="text-gray-600 dark:text-gray-300">Found: {task.urls_found}</span>
                                  <span className="text-gray-500 dark:text-gray-400">Queue: {task.urls_queued}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                {task.use_proxy ? (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30" title="Using Proxy">
                                    <FaCheckCircle className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-2 py-1.5 text-[11px]">
                                {task.user_details ? (
                                  <a
                                    href={`/user/${task.user_details.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                  >
                                    <div className="relative h-5 w-5 overflow-hidden rounded-full border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                      <Image
                                        src={task.user_details.avatar || generateAvatar(task.user_details.name)}
                                        alt={task.user_details.name}
                                        fill
                                        sizes="20px"
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                        {task.user_details.name}
                                      </p>
                                    </div>
                                  </a>
                                ) : task.user_id ? (
                                  <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-mono text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {task.user_id.slice(0, 6)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-2 py-1.5 text-[11px]">
                                {task.project_details ? (
                                  <a
                                    href={`/projects/${task.project_details.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                  >
                                    <div className="relative h-5 w-5 overflow-hidden rounded border border-gray-100 flex-shrink-0 dark:border-gray-700">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(task.project_details.url || '')}&sz=32`}
                                        alt={task.project_details.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                      {task.project_details.name}
                                    </p>
                                  </a>
                                ) : task.project_id ? (
                                  <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-mono text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    {task.project_id.slice(0, 6)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-2 py-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskSelect(task);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-1 text-[10px] font-medium text-brand-700 transition-colors hover:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
                                >
                                  <FaGlobe className="w-2.5 h-2.5" />
                                  Pages
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    )}
                  </Table>
                ) : (
                  /* Pages List for Selected Task */
                  <div className="space-y-3">
                    {/* Selected Task Info */}
                    <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative h-5 w-5 overflow-hidden rounded flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(selectedTask.domain)}&sz=32`}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.domain}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{selectedTask.seed_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getCrawlStatusBadge(selectedTask.status)}
                          <span className="text-[11px] text-gray-600 dark:text-gray-300">
                            {selectedTask.pages_crawled} pages crawled
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pages Table */}
                    <Table>
                      <TableHeader className="border-b border-gray-100 text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:text-gray-400">
                        <TableRow>
                          <TableCell className="px-2 py-1.5 w-[120px]">Crawled At</TableCell>
                          <TableCell className="px-2 py-1.5 min-w-[200px]">URL / Title</TableCell>
                          <TableCell className="px-2 py-1.5 w-[70px]">Status</TableCell>
                          <TableCell className="px-2 py-1.5 w-[70px]">Method</TableCell>
                          <TableCell className="px-2 py-1.5 w-[80px]">Duration</TableCell>
                          <TableCell className="px-2 py-1.5 w-[80px]">Content</TableCell>
                          <TableCell className="px-2 py-1.5 w-[60px]">Links</TableCell>
                          <TableCell className="px-2 py-1.5 w-[50px]">Proxy</TableCell>
                          <TableCell className="px-2 py-1.5 w-[60px]">View</TableCell>
                        </TableRow>
                      </TableHeader>
                      {crawlPagesLoading ? (
                        <TableSkeleton rows={10} columns={9} variant="logs" />
                      ) : (
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                          {crawlPages.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="px-5 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                                No pages crawled yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            crawlPages.map((page) => (
                              <TableRow key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                  {formatDateTime(page.crawled_at)}
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  <div className="flex flex-col gap-0.5">
                                    <a
                                      href={page.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 truncate max-w-[200px]"
                                    >
                                      {page.url}
                                    </a>
                                    {page.title && (
                                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                        {page.title}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  {page.status === "success" ? (
                                    <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
                                      Success
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400" title={page.error_message || ''}>
                                      Failed
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  {page.method ? (
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      page.method === "fast"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                    }`}>
                                      {page.method === "fast" ? "Fast" : "Browser"}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                  {page.duration_ms ? `${(page.duration_ms / 1000).toFixed(2)}s` : "—"}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                  {page.content_length ? `${(page.content_length / 1024).toFixed(1)}KB` : "—"}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                  {page.links_count || 0}
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  {page.proxy_used ? (
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                      <FaCheckCircle className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  {page.markdown_content ? (
                                    <button
                                      onClick={() => handleViewContent(page.markdown_content || '', page.url, page.title || '')}
                                      className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-[10px] font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                                    >
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      )}
                    </Table>

                    {/* Crawl Pages Pagination */}
                    {crawlPagesTotal > limit && (
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-white/5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Showing {((crawlPagesPage - 1) * limit) + 1}–{Math.min(crawlPagesPage * limit, crawlPagesTotal)} of {crawlPagesTotal} pages
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCrawlPagesPageChange(crawlPagesPage - 1)}
                            disabled={crawlPagesPage === 1}
                            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {crawlPagesPage} / {crawlPagesTotalPages}
                          </span>
                          <button
                            onClick={() => handleCrawlPagesPageChange(crawlPagesPage + 1)}
                            disabled={crawlPagesPage === crawlPagesTotalPages}
                            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Pagination - Hide for crawl_tasks tab as it has its own pagination */}
        {activeTab !== "crawl_tasks" && (
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
        )}
      </div>

      {/* Crawl Content Modal */}
      {showContentModal && selectedContent && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowContentModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md flex-shrink-0">
                  <FaSpider className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {selectedContent.title || 'Page Content'}
                  </h2>
                  <a
                    href={selectedContent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline truncate block"
                  >
                    {selectedContent.url}
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowContentModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 flex-shrink-0 ml-4"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Markdown Content ({selectedContent.content.length.toLocaleString()} characters)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedContent.content);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto p-4 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
                  {selectedContent.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Scrape Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-md">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Web Scraper</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Extract content from websites and PDF files</p>
                </div>
              </div>
              <button
                onClick={() => setShowScrapeModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <WebScraper />
            </div>
          </div>
        </div>
      )}

      {/* Response Content Modal */}
      {showResponseModal && selectedResponse && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowResponseModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response Content</h2>
                  <a
                    href={selectedResponse.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                  >
                    {selectedResponse.url}
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowResponseModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 flex-shrink-0 ml-4"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Content ({selectedResponse.content.length.toLocaleString()} characters)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedResponse.content);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto p-4 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
                  {selectedResponse.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
