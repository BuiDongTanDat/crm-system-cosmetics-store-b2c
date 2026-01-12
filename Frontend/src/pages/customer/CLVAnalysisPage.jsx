import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Search,
  DollarSign,
  Award,
  Clock,
  TrendingDown,
} from "lucide-react";
import CountUp from "react-countup";
import { getCLVSummary, getCLVList } from "@/services/customers";
import { Input } from "@/components/ui/input";
import AppPagination from "@/components/pagination/AppPagination";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helper";

const CLVAnalysisPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getCLVSummary();
        console.log("CLV Summary response:", res);
        if (res?.ok) setSummary(res.data);
      } catch (e) {
        console.error("Error fetching CLV summary:", e);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await getCLVList({ page, page_size: pageSize, search });
        if (res?.ok) {
          setListData(res.data);
        }
      } catch (e) {
        toast.error("Không thể tải danh sách CLV");
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
          Phân tích Giá trị vòng đời khách hàng
        </h1>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border p-6 mb-3">
        <h2 className="text-xl font-semibold mb-2">
          Customer Lifetime Value Analysis
        </h2>
        <p className="text-gray-600 mb-6">
          Phân tích giá trị suốt đời của khách hàng để tối ưu hóa chiến lược đầu
          tư và chăm sóc khách hàng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-emerald-900 text-sm">
                CLV trung bình
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-emerald-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.avg_clv_12m) / 1000000}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
                <span className="text-xl font-semibold">M VNĐ</span>
              </div>

              <p className="mt-1 text-xs text-emerald-600">
                giá trị trung bình 12 tháng
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900 text-sm">
                CLV cao nhất
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-blue-700 flex items-end gap-1">
                {summary ? (
                  <CountUp
                    end={Number(summary.max_clv_12m) / 1000000}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "..."
                )}
                <span className="text-xl font-semibold">M VNĐ</span>
              </div>

              <p className="mt-1 text-xs text-blue-600">
                 khách hàng tiềm năng nhất
              </p>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900 text-sm">
                Thời gian sống
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-orange-700">
                {summary?.avg_lifetime_months ? (
                  <CountUp
                    end={Math.round(summary.avg_lifetime_months)}
                    duration={2}
                  />
                ) : (
                  "24"
                )}
              </div>

              <p className="mt-1 text-xs text-orange-600">
                tháng trung bình gắn bó
              </p>
            </div>
          </div>

          <div className="bg-pink-50 p-6 rounded-xl border border-pink-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-pink-900 text-sm">
                ROI trung bình
              </h3>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-pink-700 flex items-end gap-1">
                {summary?.avg_roi ? (
                  <CountUp
                    end={Number(summary.avg_roi)}
                    decimals={1}
                    duration={2}
                  />
                ) : (
                  "4.8"
                )}
                <span className="text-xl font-semibold">x</span>
              </div>

              <p className="mt-1 text-xs text-pink-600">
                tỷ suất hoàn vốn đầu tư
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in transition duration-150 bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">
            Xếp hạng CLV khách hàng
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
                <th className="px-6 py-4 text-center">CLV (12m)</th>
                <th className="px-6 py-4 text-center">CLV (6m)</th>
                <th className="px-6 py-4 text-center">Tần suất</th>
                <th className="px-6 py-4 text-center">AOV</th>
                <th className="px-6 py-4 text-center">Churn Risk</th>
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
                    <td className="px-6 py-2 text-center font-medium ">
                      {formatCurrency(Number(it.clv_12m))}
                    </td>
                    <td className="px-6 py-2 text-center font-medium ">
                      {formatCurrency(Number(it.clv_6m))}
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {it.frequency_90d} lần
                    </td>
                    <td className="px-6 py-2 text-center font-medium">
                      {formatCurrency(Number(it.avg_order_value_90d))}
                    </td>
                    <td className="px-6 py-2 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              it.churn_score >= 0.7
                                ? "bg-red-500"
                                : it.churn_score >= 0.4
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
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Xếp hạng CLV khách hàng</h3>
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
                <th className="px-6 py-4 text-center">CLV (12m)</th>
                <th className="px-6 py-4 text-center">CLV (6m)</th>
                <th className="px-6 py-4 text-center">Tần suất</th>
                <th className="px-6 py-4 text-center">AOV</th>
                <th className="px-6 py-4 text-center">Churn Risk</th>
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
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{Number(it.clv_12m).toLocaleString()} đ</td>
                    <td className="px-6 py-4 text-center font-medium text-blue-600">{Number(it.clv_6m).toLocaleString()} đ</td>
                    <td className="px-6 py-4 text-center font-medium">{it.frequency_90d} lần</td>
                    <td className="px-6 py-4 text-center font-medium">{Number(it.avg_order_value_90d).toLocaleString()} đ</td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px] mx-auto overflow-hidden">
                        <div className={`h-1.5 rounded-full ${(it.churn_score || 0) > 0.7 ? 'bg-red-500' : (it.churn_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`} style={{ width: `${(it.churn_score || 0.1) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400">{(it.churn_score || 0.1).toFixed(2)}</span>
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
            handleNext={() => setPage(p => p + 1)}
            handlePrev={() => setPage(p => p - 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default CLVAnalysisPage;
