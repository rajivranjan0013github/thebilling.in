import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "../hooks/use-media-query";
import {
  Backend_URL,
  formatDate,
  DateRangePicker,
  convertFilterToDateRange,
} from "../assets/Data.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Loader from "../components/ui/loader";
import {
  Activity,
  ShoppingCart,
  IndianRupee,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ArrowLeftRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Truck,
  Landmark,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardMetrics,
  resetDashboardState,
} from "../redux/slices/dashboardSlice";

const Dashboard = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    data: dashboardData,
    loading: loadingState,
    error,
  } = useSelector((state) => state.dashboard);
  const isLoading = loadingState === "pending" || loadingState === "idle";

  const [dateFilter, setDateFilter] = useState("Today");
  const [dateRange, setDateRange] = useState(() => {
    const { from, to } = convertFilterToDateRange("Today");
    return { from, to };
  });

  useEffect(() => {
    if (dateFilter !== "Custom") {
      const { from, to } = convertFilterToDateRange(dateFilter);
      setDateRange({ from, to });
      dispatch(fetchDashboardMetrics({ from, to }));
    }
  }, [dateFilter, dispatch]);

  useEffect(() => {
    if (dateFilter === "Today" && loadingState === "idle") {
      const { from, to } = convertFilterToDateRange("Today");
      dispatch(fetchDashboardMetrics({ from, to }));
    }
  }, [dispatch, dateFilter, loadingState]);

  const handleDateRangeSelect = (range) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  const handleDateSearch = () => {
    if (dateRange.from && dateRange.to) {
      dispatch(
        fetchDashboardMetrics({ from: dateRange.from, to: dateRange.to })
      );
    }
  };

  const handleDateCancel = () => {
    const { from, to } = convertFilterToDateRange("Today");
    setDateFilter("Today");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader text="Loading dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Dashboard Overview
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/reports")}
              className="flex items-center hover:bg-indigo-50 transition-colors text-base"
            >
              <Activity className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === "Custom" && (
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={handleDateRangeSelect}
                onSearch={handleDateSearch}
                onCancel={handleDateCancel}
              />
            )}
          </div>
        </div>
        <div className="text-center py-10 text-red-600">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg">Error loading dashboard data:</p>
          <p>{typeof error === "string" ? error : JSON.stringify(error)}</p>
          <Button
            onClick={() =>
              dispatch(
                fetchDashboardMetrics({
                  from: dateRange.from,
                  to: dateRange.to,
                })
              )
            }
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.salesSummary) {
    return (
      <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Dashboard Overview
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/reports")}
              className="flex items-center hover:bg-indigo-50 transition-colors text-base"
            >
              <Activity className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "Custom" && (
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={handleDateRangeSelect}
                onSearch={handleDateSearch}
                onCancel={handleDateCancel}
              />
            )}
          </div>
        </div>
        <div className="text-center py-10">
          No data available for the selected period.
        </div>
      </div>
    );
  }

  const gradients = {
    blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
    green: "bg-gradient-to-br from-emerald-500 to-teal-600",
    purple: "bg-gradient-to-br from-purple-500 to-pink-600",
    amber: "bg-gradient-to-br from-amber-500 to-orange-600",
  };

  return (
    <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Dashboard Overview
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/reports")}
            className="flex items-center hover:bg-indigo-50 transition-colors text-base"
          >
            <Activity className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Yesterday">Yesterday</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "Custom" && (
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateRangeSelect}
              onSearch={handleDateSearch}
              onCancel={handleDateCancel}
            />
          )}
        </div>
      </div>

      {/* Stats Overview - Updated for new data structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Sales Summary */}
        <Card className="overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-indigo-50 to-blue-50 border-none cursor-pointer">
          <div className={`h-1.5 ${gradients.blue}`} />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold tracking-wide text-indigo-600">
                  Sales Summary
                </p>
                <h3 className="text-2xl font-extrabold mt-1 text-gray-900 tracking-tight">
                  ₹{dashboardData.salesSummary.totalRevenue.toLocaleString()}
                </h3>
                <p className="text-sm font-medium text-gray-600 mt-2">
                  {dashboardData.salesSummary.totalSales} orders
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Received: ₹
                  {dashboardData.salesSummary.totalAmountReceived.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-red-600 mt-1">
                  Due: ₹
                  {dashboardData.salesSummary.totalAmountDue.toLocaleString()} (
                  {dashboardData.salesSummary.dueInvoicesCount} invoices)
                </p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-indigo-500/30 shadow-inner">
                <ShoppingCart className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchase Summary */}
        <Card className="overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-none cursor-pointer">
          <div className={`h-1.5 ${gradients.green}`} />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold tracking-wide text-emerald-600">
                  Purchase Summary
                </p>
                <h3 className="text-2xl font-extrabold mt-1 text-gray-900 tracking-tight">
                  ₹{dashboardData.purchaseSummary.totalCost.toLocaleString()}
                </h3>
                <p className="text-sm font-medium text-gray-600 mt-2">
                  {dashboardData.purchaseSummary.totalPurchases} purchases
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Paid: ₹
                  {dashboardData.purchaseSummary.totalAmountPaid.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-orange-600 mt-1">
                  Due: ₹
                  {dashboardData.purchaseSummary.totalAmountDue.toLocaleString()}{" "}
                  ({dashboardData.purchaseSummary.dueInvoicesCount} invoices)
                </p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-inner">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Payment Summary */}
        <Card className="overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 border-none cursor-pointer">
          <div className={`h-1.5 ${gradients.amber}`} />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold tracking-wide text-amber-600">
                  Payment Summary
                </p>
                <h3
                  className={`text-2xl font-extrabold mt-1 tracking-tight ${
                    dashboardData.paymentSummary.netCashFlow >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  ₹{dashboardData.paymentSummary.netCashFlow.toLocaleString()}
                  <span className="text-sm font-medium text-gray-600 ml-1">
                    (Net Flow)
                  </span>
                </h3>
                <p className="text-sm font-medium text-green-600 mt-2">
                  In: ₹
                  {dashboardData.paymentSummary.totalPaymentIn.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-red-600 mt-1">
                  Out: ₹
                  {dashboardData.paymentSummary.totalPaymentOut.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-orange-500/30 shadow-inner">
                <ArrowLeftRight className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Financial Metrics */}
        <Card className="overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 border-none cursor-pointer">
          <div className={`h-1.5 ${gradients.purple}`} />
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold tracking-wide text-purple-600">
                  Financial Metrics
                </p>
                <div className="mt-2 space-y-2">
                  <p className="text-base font-medium text-red-600 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Receivables: ₹
                    {dashboardData.financialMetrics.totalReceivables.toLocaleString()}
                  </p>
                  <p className="text-base font-medium text-orange-600 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Payables: ₹
                    {dashboardData.financialMetrics.totalPayables.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/30 shadow-inner">
                <Landmark className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account-wise Payment Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Method Wise Payment In */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-none bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold tracking-wide text-green-700">
              Payment In by Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm max-h-44 overflow-y-auto space-y-2">
            {dashboardData.paymentSummary.paymentInMethods.length > 0 ? (
              dashboardData.paymentSummary.paymentInMethods.map((method) => (
                <div
                  key={method.method}
                  className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer"
                >
                  <span className="capitalize font-medium">
                    {method.method.toLowerCase()}
                  </span>
                  <span className="font-semibold text-green-700">
                    ₹{method.totalAmount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No payments received in this period.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Method Wise Payment Out */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-none bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold tracking-wide text-red-700">
              Payment Out by Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm max-h-44 overflow-y-auto space-y-2">
            {dashboardData.paymentSummary.paymentOutMethods.length > 0 ? (
              dashboardData.paymentSummary.paymentOutMethods.map((method) => (
                <div
                  key={method.method}
                  className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer"
                >
                  <span className="capitalize font-medium">
                    {method.method.toLowerCase()}
                  </span>
                  <span className="font-semibold text-red-700">
                    ₹{method.totalAmount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No payments made in this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
