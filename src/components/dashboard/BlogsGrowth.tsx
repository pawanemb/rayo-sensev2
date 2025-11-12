"use client";
import { useState, useEffect } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { Dropdown } from "../ui/dropdown/Dropdown";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface GrowthDataPoint {
  label: string;
  year: number;
  count: number;
  period_number: number;
  date?: string;
}

interface BlogsGrowthResponse {
  total_blogs: number;
  growth_data: GrowthDataPoint[];
  current_period_blogs: number;
  last_period_blogs: number;
  period_type: 'day' | 'month';
}

// Helper function to format date for API
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Service function to fetch blogs growth data
const getBlogsGrowthData = async (
  periodType: 'day' | 'month' = 'month',
  startDate?: string,
  endDate?: string
): Promise<BlogsGrowthResponse> => {
  try {
    const params = new URLSearchParams({ period_type: periodType });

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/analytics/blogs-growth?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from blogs growth API');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching blogs growth data:', error);

    // Return fallback data
    return {
      total_blogs: 0,
      growth_data: [],
      current_period_blogs: 0,
      last_period_blogs: 0,
      period_type: periodType
    };
  }
};

function BlogsGrowth() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [growthData, setGrowthData] = useState<BlogsGrowthResponse | null>(null);

  // State for controls
  const [periodType, setPeriodType] = useState<'day' | 'month'>('day');
  const [timeFrame, setTimeFrame] = useState<'last7days' | 'last30days' | 'last3months' | 'last6months' | 'custom'>('last7days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomTimeFrame, setIsCustomTimeFrame] = useState(false);

  // Dropdown state
  const [isTimeFrameDropdownOpen, setIsTimeFrameDropdownOpen] = useState(false);
  const [isPeriodTypeDropdownOpen, setIsPeriodTypeDropdownOpen] = useState(false);

  // Calculate date range based on selected time frame
  useEffect(() => {
    if (timeFrame !== 'custom') {
      const today = new Date();
      const calculatedStartDate = new Date();

      switch (timeFrame) {
        case 'last7days':
          calculatedStartDate.setDate(today.getDate() - 6);
          setPeriodType('day');
          break;
        case 'last30days':
          calculatedStartDate.setDate(today.getDate() - 29);
          setPeriodType('day');
          break;
        case 'last3months':
          calculatedStartDate.setMonth(today.getMonth() - 3);
          calculatedStartDate.setDate(1);
          setPeriodType('month');
          break;
        case 'last6months':
          calculatedStartDate.setMonth(today.getMonth() - 6);
          calculatedStartDate.setDate(1);
          setPeriodType('month');
          break;
      }

      setStartDate(formatDateForAPI(calculatedStartDate));
      setEndDate(formatDateForAPI(today));
      setIsCustomTimeFrame(false);
    }
  }, [timeFrame]);

  // Fetch data when parameters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await getBlogsGrowthData(periodType, startDate, endDate);
        setGrowthData(data);
      } catch (error) {
        console.error('Error in component:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (startDate && endDate && !isCustomTimeFrame) {
      fetchData();
    }
  }, [periodType, startDate, endDate, isCustomTimeFrame]);

  // Handle time frame change
  const handleTimeFrameChange = (newTimeFrame: typeof timeFrame) => {
    setTimeFrame(newTimeFrame);
    if (newTimeFrame === 'custom') {
      setIsCustomTimeFrame(true);
    }
  };

  // Handle custom date range
  const applyCustomDateRange = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }

    // Auto-select period type based on date range
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    setPeriodType(daysDiff <= 60 ? 'day' : 'month');

    // Trigger fetch
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getBlogsGrowthData(periodType, startDate, endDate);
        setGrowthData(data);
        setHasError(false);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!growthData || growthData.growth_data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Date/Period', 'Year', 'Blog Count'];
    const rows = growthData.growth_data.map(item => [
      item.date || item.label,
      item.year,
      item.count
    ]);

    // Add summary row
    const totalBlogs = growthData.growth_data.reduce((sum, item) => sum + item.count, 0);
    rows.push(['', 'Total:', totalBlogs]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with date range
    const filename = `blogs-growth-${startDate}-to-${endDate}.csv`;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Chart options
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: periodType === 'day' ? "70%" : "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: growthData?.growth_data.map(item => item.label) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: { text: undefined },
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (val: number) => `${val} blogs`,
      },
    },
  };

  const series = [
    {
      name: "New Blogs",
      data: growthData?.growth_data.map(item => item.count) || [],
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse dark:bg-gray-700"></div>
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse dark:bg-gray-700"></div>
        </div>
        <div className="mt-6 h-[180px] bg-gray-100 rounded-md animate-pulse dark:bg-gray-800/50"></div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/20">
        <div className="flex flex-col items-center justify-center h-[220px]">
          <div className="text-gray-500 dark:text-gray-400 mb-4 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium mb-1">Unable to load data</p>
            <p className="text-sm opacity-75">There was an issue fetching the blogs growth data</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'last7days': return 'Last 7 days';
      case 'last30days': return 'Last 30 days';
      case 'last3months': return 'Last 3 months';
      case 'last6months': return 'Last 6 months';
      case 'custom': return `${startDate} to ${endDate}`;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col space-y-4">
        {/* Header with controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
              New Blogs
              <span className="text-sm bg-brand-50 text-brand-600 py-0.5 px-2 rounded-full dark:bg-brand-500/15 dark:text-brand-400">
                {growthData?.growth_data.reduce((sum, item) => sum + item.count, 0) || 0}
              </span>
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{getTimeFrameLabel()}</p>
          </div>

          {/* Time frame selector */}
          <div className="flex items-center gap-2">
            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              disabled={!growthData || growthData.growth_data.length === 0}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <div className="relative">
              <button
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dropdown-toggle"
                onClick={() => setIsTimeFrameDropdownOpen(!isTimeFrameDropdownOpen)}
              >
                <span>{timeFrame === 'last7days' ? 'Last 7 days' : timeFrame === 'last30days' ? 'Last 30 days' : timeFrame === 'last3months' ? 'Last 3 months' : timeFrame === 'last6months' ? 'Last 6 months' : 'Custom'}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <Dropdown
                isOpen={isTimeFrameDropdownOpen}
                onClose={() => setIsTimeFrameDropdownOpen(false)}
                className="w-40 p-2"
              >
                {(['last7days', 'last30days', 'last3months', 'last6months', 'custom'] as const).map((option) => (
                  <button
                    key={option}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${timeFrame === option ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => {
                      handleTimeFrameChange(option);
                      setIsTimeFrameDropdownOpen(false);
                    }}
                  >
                    {option === 'last7days' ? 'Last 7 days' : option === 'last30days' ? 'Last 30 days' : option === 'last3months' ? 'Last 3 months' : option === 'last6months' ? 'Last 6 months' : 'Custom range'}
                  </button>
                ))}
              </Dropdown>
            </div>

            <div className="relative">
              <button
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dropdown-toggle"
                onClick={() => setIsPeriodTypeDropdownOpen(!isPeriodTypeDropdownOpen)}
              >
                <span>{periodType === 'day' ? 'Daily' : 'Monthly'}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <Dropdown
                isOpen={isPeriodTypeDropdownOpen}
                onClose={() => setIsPeriodTypeDropdownOpen(false)}
                className="w-24 p-2"
              >
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${periodType === 'day' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => {
                    setPeriodType('day');
                    setIsPeriodTypeDropdownOpen(false);
                  }}
                >
                  Daily
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${periodType === 'month' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => {
                    setPeriodType('month');
                    setIsPeriodTypeDropdownOpen(false);
                  }}
                >
                  Monthly
                </button>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Custom date range selector */}
        {isCustomTimeFrame && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={applyCustomDateRange}
              className="px-3 py-1 bg-brand-500 text-white text-sm rounded-md hover:bg-brand-600 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Chart */}
        <div className="max-w-full overflow-x-auto">
          {growthData?.growth_data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium mb-1">No data available</p>
              <p className="text-sm opacity-75">No blogs found in the selected date range</p>
            </div>
          ) : (
            <div className="min-w-[650px] xl:min-w-full">
              <ReactApexChart
                options={options}
                series={series}
                type="bar"
                height={180}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogsGrowth;
