import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupOrder } from "@/services/orders";
import { formatCurrency, formatDateTime } from "@/utils/helper";
import { toast } from "sonner";
import {
  Search,
  X,
  Package,
  CreditCard,
  User,
  FileText,
  Loader2,
} from "lucide-react";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  cancelled: "Đã hủy",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
  shipped: "Đã giao hàng",
  completed: "Hoàn tất",
  draft_cart: "Giỏ hàng",
  awaiting_customer_confirmation: "Chờ xác nhận",
};

const PAYMENT_LABELS = {
  credit_card: "Thẻ tín dụng",
  paypal: "PayPal",
  bank_transfer: "Chuyển khoản",
  cash_on_delivery: "Thanh toán khi nhận hàng",
};

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h2>
            <div className="text-sm text-blue-600 font-semibold">
              #{order.order_id.slice(-8).toUpperCase()}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Khách hàng
                  </div>
                  <div className="font-semibold text-gray-900">
                    {order.customer_name || "Khách lẻ"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Thanh toán
                  </div>
                  <div className="font-semibold text-gray-900">
                    {PAYMENT_LABELS[order.payment_method] ||
                      order.payment_method ||
                      "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Trạng thái
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                                        ${
                                          order.status === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : order.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        } `}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Ghi chú
                  </div>
                  <div className="text-sm text-gray-900">
                    {order.notes || "Không có ghi chú"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items List - Optimized */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Danh sách sản phẩm ({order.items?.length || 0})
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 border-b border-gray-200 font-semibold text-sm text-gray-700">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-right">Giá gốc</div>
                <div className="col-span-2 text-center">Giảm giá</div>
                <div className="col-span-1 text-center">SL</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-200 transition-colors items-center"
                  >
                    {/* Product Info */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-white border flex-shrink-0 overflow-hidden">
                        <img
                          src={item.image || "/default-product-image.png"}
                          className="w-full h-full object-cover"
                          alt={item.product_name}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-medium text-gray-900 line-clamp-2 text-sm"
                          title={item.product_name}
                        >
                          {item.product_name}
                        </div>
                      </div>
                    </div>

                    {/* Original Price */}
                    <div className="col-span-2 text-right">
                      <div className="text-sm text-gray-500 line-through">
                        {formatCurrency(item.price_original)}
                      </div>
                      <div className="text-sm font-semibold ">
                        {formatCurrency(item.price_unit)}
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="col-span-2 text-center">
                      {item.discount > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          -{Math.round(item.discount * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm">
                        x {item.quantity}
                      </span>
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t bg-gray-50 rounded-b-xl">
          <div className="px-6 py-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Phí vận chuyển:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(0)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderLookupPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);
    try {
      // Determine if email or phone
      const isEmail = query.includes("@");
      const payload = isEmail ? { email: query } : { phone: query };

      const res = await lookupOrder(payload);
      if (res && res.success) {
        setResults(res.data || []);
        if (res.data.length === 0) {
          toast.info("Không tìm thấy đơn hàng nào với thông tin này.");
        }
      } else {
        toast.error(res?.message || "Tra cứu thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi tra cứu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 ">
      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Title Section */}
      <div className="animate-fade-in transition duration-150  w-full max-w-3xl text-center mb-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tra cứu đơn hàng
        </h1>
        <p className="text-gray-600">
          Nhập số điện thoại hoặc email để kiểm tra tình trạng đơn hàng của bạn.
        </p>
      </div>

      {/* Search Form */}
      <div className="animate-fade-in transition duration-150 w-full max-w-md bg-white rounded-xl shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            variant="normal"
            className="flex-1"
            placeholder="Email hoặc Số điện thoại"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="actionUpdate" disabled={loading}>
            {loading ? <Loader2 /> : <Search className="w-4 h-4" />}
            Tra cứu
          </Button>
        </form>
      </div>

       {/* Results */}
      <div className="w-full max-w-3xl space-y-4">
        {results &&
          results.map((order) => (
            <div
              key={order.order_id}
              className="animate-fade-in duration-150 bg-white rounded-lg shadow border p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row justify-between mb-4 pb-4 border-b">
                <div>
                  <div className="text-sm text-gray-500">Mã đơn hàng</div>
                  <div className="font-semibold text-blue-600">
                    #{order.order_id.slice(-8).toUpperCase()}
                  </div>
                </div>
                <div className="items-end">
                  <div className="text-sm text-gray-500">Ngày đặt</div>
                  <div className="font-medium">
                    {formatDateTime(order.order_date)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="text-sm text-gray-500 mb-2">Sản phẩm</div>
                  <div className="space-y-2">
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                          <img
                            src={item.image || "/default-product-image.png"}
                            className="w-full h-full object-cover"
                            title={item.product_name}
                            alt={item.product_name}
                          />
                        </div>
                        <div className="line-clamp-1">
                          {item.product_name} x {item.quantity}
                        </div>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <div className="text-xs text-gray-400 italic">
                        ...và thêm {order.items.length - 3} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end min-w-[140px] gap-2">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Tổng tiền</div>
                    <div className="font-bold text-lg text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                                    ${
                                      order.status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
