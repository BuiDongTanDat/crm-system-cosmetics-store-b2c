import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  UserX,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/pages/report/charts/MetricCard";
import { reportData } from "@/lib/data";
import ProductReport from "@/pages/report/components/ProductReport";
import RevenueReport from "@/pages/report/components/RevenueReport";
import LeadCustomerReport from "@/pages/report/components/LeadCustomerReport";

export default function ReportPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
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
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label className="text-sm text-gray-600 mr-2">Từ ngày:</label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">Đến ngày:</label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
          </div>
          {selectedTab === "product" && (
            <div>
              <label className="text-sm text-gray-600 mr-2">
                Loại sản phẩm:
              </label>
              <select
                name="productType"
                value={filters.productType}
                onChange={handleFilterChange}
                className="border rounded px-2 py-1"
              >
                <option value="">Tất cả</option>
                <option value="A">Sản phẩm A</option>
                <option value="B">Sản phẩm B</option>
              </select>
            </div>
          )}
          {selectedTab === "customer_lead" && (
            <div>
              <label className="text-sm text-gray-600 mr-2">
                Loại khách hàng:
              </label>
              <select
                name="customerType"
                value={filters.customerType}
                onChange={handleFilterChange}
                className="border rounded px-2 py-1"
              >
                <option value="">Tất cả</option>
                <option value="customer">Khách hàng</option>
                <option value="lead">Lead</option>
              </select>
            </div>
          )}
          <Button variant="actionNormal" size="sm" onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        </div>
      )}

      {/* Nội dung các tab */}
      <div className="flex-1 p-6 space-y-6">
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
