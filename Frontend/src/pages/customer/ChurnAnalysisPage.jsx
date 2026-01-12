import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  TrendingDown,
  AlertCircle,
  DollarSign,
  UserCheck,
} from "lucide-react";
import CountUp from "react-countup";
import { getChurnSummary, getChurnList } from "@/services/customers";
import { Input } from "@/components/ui/input";
import AppPagination from "@/components/pagination/AppPagination";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helper";

const ChurnAnalysisPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getChurnSummary();
        if (res?.ok) setSummary(res.data);
      } catch (e) {
        console.error("Error fetching Churn summary:", e);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await getChurnList({ page, page_size: pageSize, search });
        if (res?.ok) {
          setListData(res.data);
        }
      } catch (e) {
        toast.error("Không thể tải danh sách Churn");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [page, search, pageSize]);

  return (
    <div className="p-0">
      <div className="flex-col z-20 gap-3 p-3 my-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Phân tích Tỷ lệ rời bỏ của khách hàng
        </h1>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border p-6 mb-3">
        <h2 className="text-xl font-semibold mb-2">Customer Churn Analysis</h2>
        <p className="text-gray-600 mb-6">
          Phân tích tỷ lệ rời bỏ khách hàng và dự đoán khách hàng có khả năng
          churn để có biện pháp giữ chân kịp thời.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-red-900 text-sm">
                Tỷ lệ Churn
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-red-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.churn_rate_proxy) * 100}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "12.5"
                )}
                <span className="text-xl font-semibold">%</span>
              </div>

              <p className="mt-1 text-xs text-red-600">
                tổng khách hàng có nguy cơ rời bỏ
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-yellow-900 text-sm">
                Nguy cơ cao
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-yellow-700">
                {summary ? (
                  <CountUp end={summary.high_risk_customers} duration={2} />
                ) : (
                  "..."
                )}
              </div>

              <p className="mt-1 text-xs text-yellow-600">
                khách hàng có nguy cơ cao
              </p>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900 text-sm">
                Doanh thu ảnh hưởng
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-orange-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.revenue_at_risk_12m) / 1000000}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
                <span className="text-xl font-semibold">M VNĐ</span>
              </div>

              <p className="mt-1 text-xs text-orange-600">
               có thể mất trong 12 tháng
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900 text-sm">
                Tỷ lệ giữ chân
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-green-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.retention_proxy) * 100}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
                <span className="text-xl font-semibold">%</span>
              </div>

              <p className="mt-1 text-xs text-green-600">
                khách hàng ổn định và trung thành
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">
            Cảnh báo rủi ro rời bỏ
          </h3>
          <div className="relative w-64 text-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4 text-center">Churn Score</th>
                <th className="px-6 py-4 text-center">Rủi ro</th>
                <th className="px-6 py-4 text-center">Recency</th>
                <th className="px-6 py-4 text-center">CLV (12m)</th>
                <th className="px-6 py-4 text-center">Tần suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : listData.items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    Không tìm thấy dữ liệu
                  </td>
                </tr>
              ) : (
                listData.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-2">
                      <div className="font-medium text-gray-900">
                        {it.customer?.full_name || "Khách ẩn danh"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {it.customer?.phone || it.customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              it.risk_level === "HIGH"
                                ? "bg-red-500"
                                : it.risk_level === "MEDIUM"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${it.churn_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">
                          {(it.churn_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          it.risk_level === "HIGH"
                            ? "bg-red-100 text-red-600"
                            : it.risk_level === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {it.risk_level === "HIGH"
                          ? "CAO"
                          : it.risk_level === "MEDIUM"
                          ? "TRUNG BÌNH"
                          : "THẤP"}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-center text-gray-600">
                      {it.recency_days} ngày
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {formatCurrency(Number(it.clv_12m))}
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {it.frequency_90d} lần
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <AppPagination
            currentPage={page}
            totalPages={Math.ceil(listData.total / pageSize)}
            handlePageChange={setPage}
            handleNext={() => setPage((p) => p + 1)}
            handlePrev={() => setPage((p) => p - 1)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Cảnh báo rủi ro rời bỏ</h3>
          <div className="relative w-64 text-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4 text-center">Churn Score</th>
                <th className="px-6 py-4 text-center">Rủi ro</th>
                <th className="px-6 py-4 text-center">Recency</th>
                <th className="px-6 py-4 text-center">CLV (12m)</th>
                <th className="px-6 py-4 text-center">Tần suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : listData.items.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">Không tìm thấy dữ liệu</td></tr>
              ) : (
                listData.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{it.customer?.full_name || 'Khách ẩn danh'}</div>
                      <div className="text-xs text-gray-500">{it.customer?.phone || it.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${it.risk_level === 'HIGH' ? 'bg-red-500' : it.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} style={{ width: `${it.churn_score * 100}%` }}></div>
                        </div>
                        <span className="text-sm">{(it.churn_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${it.risk_level === 'HIGH' ? 'bg-red-100 text-red-600' :
                          it.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                        }`}>
                        {it.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{it.recency_days} ngày</td>
                    <td className="px-6 py-4 text-center font-medium">{Number(it.clv_12m).toLocaleString()} đ</td>
                    <td className="px-6 py-4 text-center font-medium">{it.frequency_90d} lần</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <AppPagination
            currentPage={page}
            totalPages={Math.ceil(listData.total / pageSize)}
            handlePageChange={setPage}
            handleNext={() => setPage(p => p + 1)}
            handlePrev={() => setPage(p => p - 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChurnAnalysisPage;
