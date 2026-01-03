import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  UserX,
  MessageCircle,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CalendarRangePicker from "@/components/common/calendar-range-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import MetricCard from "@/pages/report/charts/MetricCard";
import { reportData } from "@/lib/data";
import ProductReport from "@/pages/report/components/ProductReport";
import RevenueReport from "@/pages/report/components/RevenueReport";
import LeadCustomerReport from "@/pages/report/components/LeadCustomerReport";
import DropdownOptions from "@/components/common/DropdownOptions";

export default function ReportPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    productType: "",
    customerType: "",
    campaignType: "",
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    // Update filters with formatted dates
    setFilters({
      ...filters,
      from: range?.from ? range.from.toISOString().split('T')[0] : "",
      to: range?.to ? range.to.toISOString().split('T')[0] : "",
    });
  };

  const handleExportExcel = () => {
    alert("Xuất file Excel thành công!");
  };

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="my-3 z-20 flex gap-3 p-3 bg-brand/10 backdrop-blur-lg rounded-md">
        <div className="flex-col items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Báo cáo & Phân tích
            </h1>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2">
            {[
              {
                id: "overview",
                label: "Tổng quan",
                icon: TrendingUp,
              },
              {
                id: "product",
                label: "Báo cáo Sản phẩm",
                icon: BarChart3,
              },
              {
                id: "revenue",
                label: "Báo cáo Doanh thu",
                icon: TrendingUp,
              },
              {
                id: "customer_lead",
                label: "Thống kê KH/Lead",
                icon: Users,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={
                    selectedTab === tab.id ? "actionCreate" : "actionNormal"
                  }
                  size="sm"
                  onClick={() => setSelectedTab(tab.id)}
                  className="flex items-center gap-1"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bộ lọc cho các báo cáo chi tiết */}
      {selectedTab !== "overview" && (
        <div className="justify-between items-center bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap gap-4 mb-4">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
            {/* <label className="text-sm text-gray-600">Chọn khoảng thời gian:</label> */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: vi })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: vi })
                    )
                  ) : (
                    <span>Chọn khoảng thời gian</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                />
              </PopoverContent>
            </Popover>
          </div>
          {selectedTab === "product" && (
            <DropdownOptions
              label="Loại sản phẩm"
              name="productType"
              options={[
                { value: "", label: "Tất cả" },
                { value: "physical", label: "Vật lý" },
                { value: "digital", label: "Kỹ thuật số" },
              ]}
              value={filters.productType}
              onChange={handleFilterChange}
              width="w-auto"
            />
          )}
          {selectedTab === "customer_lead" && (
           <DropdownOptions
              label="Loại khách hàng"
              name="customerType"
              options={[
                { value: "", label: "Loại khách hàng" },
                { value: "new", label: "Mới" },
                { value: "returning", label: "Quay lại" },
              ]}
              value={filters.customerType}
              onChange={handleFilterChange}
              width="w-auto"
            />
          )}
          </div>
          <Button variant="actionUpdate" size="sm" onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        </div>
      )}

      {/* Nội dung các tab */}
      <div className="flex-1 space-y-6">
        {selectedTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="CSAT Score"
                value={reportData.csatData.currentScore}
                suffix="/5"
                trend={reportData.csatData.trend}
                icon={Star}
                color="yellow"
              />
              <MetricCard
                title="NPS Score"
                value={reportData.npsData.score}
                trend={reportData.npsData.trend}
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="Tỷ lệ rời bỏ"
                value={reportData.churnData.rate}
                suffix="%"
                trend={reportData.churnData.trend}
                icon={UserX}
                color="red"
              />
              <MetricCard
                title="Thời gian phản hồi"
                value={reportData.customerInteraction.quality.responseTime}
                icon={MessageCircle}
                color="blue"
              />
            </div>
          </>
        )}
        {selectedTab === "product" && <ProductReport filters={filters} />}
        {selectedTab === "revenue" && <RevenueReport />}
        {selectedTab === "customer_lead" && (
          <LeadCustomerReport filters={filters} />
        )}
      </div>
    </div>
  );
}
