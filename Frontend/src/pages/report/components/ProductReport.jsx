// filepath: e:\DuAnCNTT\Nopgit\Frontend\src\pages\report\components\ProductReport.jsx
import React, { useEffect, useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import MetricCard from "@/pages/report/charts/MetricCard";
import { getProducts } from "@/services/products";
import { Pie, PieChart, Label, Cell, Sector } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDate } from "@/utils/helper";
import { data } from "react-router";

const STATUS_LABELS = {
  AVAILABLE: "Còn hàng",
  OUT_OF_STOCK: "Hết hàng",
  DISCONTINUED: "Ngừng bán",
};

const STATUS_COLORS = {
  AVAILABLE: "#22c55e",
  OUT_OF_STOCK: "#ef4444",
  DISCONTINUED: "#a3a3a3",
};

const chartConfig = {
  count: {
    label: "Số lượng",
  },
};

export default function ProductReport({ filters }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusIndex, setActiveStatusIndex] = useState(-1);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);

  // Fetch sản phẩm
  useEffect(() => {
    setLoading(true);
    getProducts().then((res) => {
      let data = Array.isArray(res) ? res : res?.data || [];
      console.log("Fetched products:", data);
      setProducts(data);
      setLoading(false);
    });
  }, [filters]);

  // Thống kê
  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.status === "AVAILABLE").length;
    const outOfStock = products.filter(
      (p) => p.status === "OUT_OF_STOCK"
    ).length;
    const discontinued = products.filter(
      (p) => p.status === "DISCONTINUED"
    ).length;
    const lastImport = products.reduce((max, p) => {
      if (p.import_date && (!max || new Date(p.import_date) > new Date(max)))
        return p.import_date;
      return max;
    }, null);

    // Pie chart data trạng thái
    const pieStatusData = [
      {
        status: STATUS_LABELS.AVAILABLE,
        count: available,
        fill: STATUS_COLORS.AVAILABLE,
        key: "AVAILABLE",
      },
      {
        status: STATUS_LABELS.OUT_OF_STOCK,
        count: outOfStock,
        fill: STATUS_COLORS.OUT_OF_STOCK,
        key: "OUT_OF_STOCK",
      },
      {
        status: STATUS_LABELS.DISCONTINUED,
        count: discontinued,
        fill: STATUS_COLORS.DISCONTINUED,
        key: "DISCONTINUED",
      },
    ].filter((d) => d.count > 0);

    // Pie chart data danh mục
    const categoryMap = {};
    products.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    const pieCategoryData = Object.entries(categoryMap).map(
      ([category, count], idx) => ({
        category,
        count,
        fill: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
      })
    );

    return {
      total,
      available,
      outOfStock,
      discontinued,
      lastImport: lastImport || "--",
      pieStatusData,
      pieCategoryData,
      products,
    };
  }, [products]);

  // Tooltip cho trạng thái
  const pieStatusTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const percent = stats.total
      ? ((d.count / stats.total) * 100).toFixed(1)
      : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.status}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  // Tooltip cho danh mục
  const pieCategoryTooltip = (props) => {
    const { payload } = props;
    if (!payload?.length) return null;
    const d = payload[0].payload;
    const percent = stats.total
      ? ((d.count / stats.total) * 100).toFixed(1)
      : 0;
    return (
      <ChartTooltipContent>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{d.category}</span>
          <span>
            Số lượng: <b>{d.count}</b>
          </span>
          <span>
            Tỉ lệ: <b>{percent}%</b>
          </span>
        </div>
      </ChartTooltipContent>
    );
  };

  return (
    <div className="space-y-4">
      {/* Thống kê tổng quan sản phẩm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng số sản phẩm"
          value={stats.total}
          icon={BarChart3}
          color="blue"
        />
        <MetricCard
          title="Sản phẩm còn hàng"
          value={stats.available}
          icon={BarChart3}
          color="green"
        />
        <MetricCard
          title="Sản phẩm hết hàng"
          value={stats.outOfStock}
          icon={BarChart3}
          color="red"
        />
        <MetricCard
          title="Ngày nhập gần nhất"
          value={stats.lastImport}
          icon={BarChart3}
          color="yellow"
        />
      </div>
      {/* Pie chart trạng thái & Pie chart danh mục */}
      <div className="grid grid-cols-1 lg:grid-cols-2  gap-4">
        {/* Pie trạng thái */}
        <div className="flex flex-row items-stretch bg-white p-0 rounded-lg border border-gray-200">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <div className="mb-4">
              <h3 className="text-base font-semibold">
                Tỷ lệ sản phẩm theo trạng thái
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.pieStatusData.map((d, idx) => {
                const percent = stats.total
                  ? ((d.count / stats.total) * 100).toFixed(1)
                  : 0;
                const isActive = activeStatusIndex === idx;
                return (
                  <div
                    key={d.status}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${
                      isActive ? "font-bold text-blue-600 scale-105" : ""
                    }`}
                    onMouseEnter={() => setActiveStatusIndex(idx)}
                    onMouseLeave={() => setActiveStatusIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.status}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center w-1/2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[250px] w-[250px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={pieStatusTooltip} />
                <Pie
                  data={stats.pieStatusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeStatusIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveStatusIndex(idx)}
                  onMouseLeave={() => setActiveStatusIndex(-1)}
                >
                  {stats.pieStatusData.map((entry, idx) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null;
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {stats.total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng SP
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
        {/* Pie danh mục */}
        <div className="flex flex-row items-stretch bg-white p-0 rounded-lg border border-gray-200">
          <div className="flex flex-col justify-between p-6 w-1/2 min-w-[180px]">
            <div className="mb-4">
              <h3 className="text-base font-semibold">
                Tỷ lệ sản phẩm theo danh mục
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.pieCategoryData.map((d, idx) => {
                const percent = stats.total
                  ? ((d.count / stats.total) * 100).toFixed(1)
                  : 0;
                const isActive = activeCategoryIndex === idx;
                return (
                  <div
                    key={d.category}
                    className={`flex items-center gap-2 text-sm transition-all duration-150 cursor-pointer ${
                      isActive ? "font-bold text-blue-600 scale-105" : ""
                    }`}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(-1)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: d.fill,
                        border: isActive ? "2px solid #2563eb" : "none",
                      }}
                    ></span>
                    <span>{d.category}</span>
                    <span className="font-semibold">{d.count}</span>
                    <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center w-1/2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[250px] w-[250px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={pieCategoryTooltip} />
                <Pie
                  data={stats.pieCategoryData}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={true}
                  activeIndex={activeCategoryIndex}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 12} />
                  )}
                  onMouseEnter={(_, idx) => setActiveCategoryIndex(idx)}
                  onMouseLeave={() => setActiveCategoryIndex(-1)}
                >
                  {stats.pieCategoryData.map((entry, idx) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null;
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {stats.total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Tổng SP
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {/* Bảng sản phẩm chi tiết */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Danh sách sản phẩm</h3>
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tên sản phẩm
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Danh mục
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Tồn kho
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.products.map((p, idx) => (
              <tr key={idx}>
                <td className="px-2 py-2 text-left line-clamp-2 max-w-sm">{p.name}</td>
                <td className="px-2 py-2 text-left">{p.category}</td>
                <td className="px-2 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : p.status === "OUT_OF_STOCK"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[p.status] || "Khác"}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">{p.inventory_qty}</td>
                <td className="px-2 py-2 text-center">
                  {formatDate(p.created_at) || "--"}
                </td>
              </tr>
            ))}
            {stats.products.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Không có dữ liệu sản phẩm mẫu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
