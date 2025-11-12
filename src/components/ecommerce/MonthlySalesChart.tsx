"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

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

interface UserGrowthResponse {
  total_users: number;
  growth_data: GrowthDataPoint[];
  current_period_users: number;
  last_period_users: number;
  period_type: 'day' | 'month';
}

// Service function to fetch user growth data
const getUserGrowthData = async (
  periodType: 'day' | 'month' = 'month',
  startDate?: string,
  endDate?: string
): Promise<UserGrowthResponse> => {
  try {
    const params = new URLSearchParams({ period_type: periodType });

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/analytics/user-growth?${params.toString()}`, {
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

    if (!data || typeof data.total_users !== 'number' || !Array.isArray(data.growth_data)) {
      throw new Error('Invalid response format from user growth API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching user growth data:', error);

    return {
      total_users: 0,
      growth_data: [],
      current_period_users: 0,
      last_period_users: 0,
      period_type: periodType
    };
  }
};

export default function MonthlySalesChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [growthData, setGrowthData] = useState<UserGrowthResponse | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch last 6 months data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Get last 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 5); // Last 6 months

        const data = await getUserGrowthData(
          'month',
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        setGrowthData(data);
      } catch (error) {
        console.error('Error in component:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
        dataLabels: {
          position: 'top',
        }
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toString(),
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        colors: [isDarkMode ? '#D1D5DB' : '#6B7280']
      },
      background: {
        enabled: false,
      }
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: growthData?.growth_data.map(item => item.label) || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val} users`,
      },
    },
  };

  const series = [
    {
      name: "Users",
      data: growthData?.growth_data.map(item => item.count) || [],
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse dark:bg-gray-700"></div>
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
        </div>
        <div className="h-[180px] bg-gray-100 rounded-md animate-pulse dark:bg-gray-800/50"></div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Users
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[180px] text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium mb-1">Unable to load data</p>
          <p className="text-sm opacity-75">There was an issue fetching the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
          Users
          {typeof growthData?.total_users === 'number' && (
            <span className="text-sm bg-brand-50 text-brand-600 py-0.5 px-2 rounded-full dark:bg-brand-500/15 dark:text-white">
              {growthData.total_users}
            </span>
          )}
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {growthData?.growth_data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[180px] text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium mb-1">No data available</p>
            <p className="text-sm opacity-75">No customers found in the last 6 months</p>
          </div>
        ) : (
          <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
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
  );
}
