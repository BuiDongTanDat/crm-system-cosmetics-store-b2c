import React, { useState, useEffect } from "react";
import { BarChart3, Search, Activity, DollarSign, Star } from "lucide-react";
import CountUp from "react-countup";
import { getCFMSummary, getCFMList } from "@/services/customers";
import { Input } from "@/components/ui/input";
import AppPagination from "@/components/pagination/AppPagination";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helper";

const CFMAnalysisPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getCFMSummary();
        console.log("CFM Summary response:", res);
        if (res?.ok) setSummary(res.data);
      } catch (e) {
        console.error("Error fetching CFM summary:", e);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await getCFMList({ page, page_size: pageSize, search });
        console.log("CFM List response:", res);
        if (res?.ok) {
          setListData(res.data);
        }
      } catch (e) {
        toast.error("Không thể tải danh sách CFM");
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
          Phân tích Tần suất và giá trị khách hàng
        </h1>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border p-6 mb-3">
        <h2 className="text-xl font-semibold mb-2">
          Customer Frequency Monetary Analysis
        </h2>
        <p className="text-gray-600 mb-6">
          Phân tích tần suất và giá trị mua hàng của khách hàng để đưa ra chiến
          lược marketing phù hợp.
        </p>

        <div className="animate-fade-in transition duration-150 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-indigo-900 text-sm">
                Tần suất mua hàng
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-indigo-700">
                {summary ? (
                  <CountUp
                    end={Number(summary.avg_frequency_90d)}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
              </div>

              <p className="mt-1 text-xs text-indigo-600">
                lần/90 ngày trung bình
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900 text-sm">
                Giá trị TB
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-green-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.avg_order_value_90d) / 1000000}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
                <span className="text-xl font-semibold">M VNĐ</span>
              </div>

              <p className="mt-1 text-xs text-green-600">
                đơn hàng trung bình
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900 text-sm">
                CFM Score
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-purple-700 flex items-end gap-1">
                {summary?.avg_cfm_score ? (
                  <CountUp
                    end={Number(summary.avg_cfm_score)}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "0"
                )}
                <span className="text-xl font-semibold">/10</span>
              </div>

              <p className="mt-1 text-xs text-purple-600">
                điểm CFM trung bình
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">
            Danh sách khách hàng
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
                <th className="px-6 py-4 text-center">Tần suất (90d)</th>
                <th className="px-6 py-4 text-center">Giá trị (90d)</th>
                <th className="px-6 py-4 text-center">AOV</th>
                <th className="px-6 py-4 text-center">Recency</th>
                <th className="px-6 py-4 text-center">Score</th>
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
                    <td className="px-6 py-2 text-center font-medium">
                      {it.frequency_90d} lần
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {formatCurrency(Number(it.monetary_90d))} 
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {formatCurrency(Number(it.avg_order_value_90d))} 
                    </td>
                    <td className="px-6 py-2 text-center text-gray-600">
                      {it.recency_days} ngày
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          (it.cfm_score || 8) >= 8
                            ? "bg-green-100 text-green-700"
                            : (it.cfm_score || 8) >= 5
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        } `}
                      >
                        {it.cfm_score || 8.0}
                      </span>
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

      
    </div>
  );
};

export default CFMAnalysisPage;
