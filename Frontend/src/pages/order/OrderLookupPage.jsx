
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupOrder } from "@/services/orders";
import { formatCurrency, formatDateTime } from "@/utils/helper";
import { toast } from "sonner";
import { Search, X, Package, CreditCard, User, FileText } from "lucide-react";
import Loading from "@/components/common/Loading";

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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
                        <div className="text-sm text-blue-600 font-semibold">#{order.order_id.slice(-8).toUpperCase()}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Khách hàng</div>
                                    <div className="font-semibold text-gray-900">{order.customer_name || "Khách lẻ"}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Thanh toán</div>
                                    <div className="font-semibold text-gray-900">{PAYMENT_LABELS[order.payment_method] || order.payment_method || "-"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Trạng thái</div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        } `}>
                                        {STATUS_LABELS[order.status] || order.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Ghi chú</div>
                                    <div className="text-sm text-gray-900">{order.notes || "Không có ghi chú"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            Danh sách sản phẩm ({order.items?.length || 0})
                        </h3>
                        <div className="bg-gray-50 rounded-xl overflow-hidden border">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-gray-100 transition">
                                    <div className="w-16 h-16 rounded-lg bg-white border flex-shrink-0 overflow-hidden">
                                        <img src={item.image || "/default-product-image.png"} className="w-full h-full object-cover" alt={item.product_name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate" title={item.product_name}>{item.product_name}</div>
                                        <div className="text-sm text-gray-500">
                                            {formatCurrency(item.price_unit)} x {item.quantity}
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900 text-right whitespace-nowrap">
                                        {formatCurrency(item.line_total || (item.price_unit * item.quantity))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Summary */}
                    <div className="flex flex-col items-end gap-2 pt-4 border-t">
                        <div className="flex justify-between w-full max-w-xs text-sm">
                            <span className="text-gray-500">Tạm tính:</span>
                            <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                        </div>
                        {/* Nếu có phí ship hoặc giảm giá thì thêm vào đây */}
                        <div className="flex justify-between w-full max-w-xs text-lg font-bold text-blue-600 mt-2">
                            <span>Tổng cộng:</span>
                            <span>{formatCurrency(order.total_amount)}</span>
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
            const isEmail = query.includes('@');
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center relative">
            {/* Header */}
            <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-3 mb-12">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = '/landing'}>
                        <img src="/images/logo/Logo.svg" alt="CChain" className="h-8 w-8" />
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                            CChain Beauty
                        </span>
                    </div>
                </div>
            </header>

            {/* Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            {/* Title Section */}
            <div className="w-full max-w-3xl text-center mb-8 px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tra cứu đơn hàng</h1>
                <p className="text-gray-600">
                    Nhập số điện thoại hoặc email để kiểm tra tình trạng đơn hàng của bạn.
                </p>
            </div>

            {/* Search Form */}
            <div className="w-full max-w-md bg-white rounded-xl shadow p-6 mb-8">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        className="flex-1"
                        placeholder="Email hoặc Số điện thoại"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" variant="actionUpdate" disabled={loading}>
                        {loading ? <Loading size="sm" /> : <Search className="w-4 h-4" />}
                        Tra cứu
                    </Button>
                </form>
            </div>

            {/* Results */}
            <div className="w-full max-w-3xl space-y-4">
                {results && results.map((order) => (
                    <div key={order.order_id} className="bg-white rounded-lg shadow border p-6 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row justify-between mb-4 pb-4 border-b">
                            <div>
                                <div className="text-sm text-gray-500">Mã đơn hàng</div>
                                <div className="font-semibold text-blue-600">#{order.order_id.slice(-8).toUpperCase()}</div>
                            </div>
                            <div className="text-right sm:text-left">
                                <div className="text-sm text-gray-500">Ngày đặt</div>
                                <div className="font-medium">{formatDateTime(order.order_date)}</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex-1 w-full">
                                <div className="text-sm text-gray-500 mb-2">Sản phẩm</div>
                                <div className="space-y-2">
                                    {(order.items || []).slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                <img src={item.image || "/default-product-image.png"} className="w-full h-full object-cover" title={item.product_name} alt={item.product_name} />
                                            </div>
                                            <div className="line-clamp-1">{item.product_name} x {item.quantity}</div>
                                        </div>
                                    ))}
                                    {(order.items || []).length > 3 && (
                                        <div className="text-xs text-gray-400 italic">...và thêm {order.items.length - 3} sản phẩm khác</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end min-w-[140px] gap-2">
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Tổng tiền</div>
                                    <div className="font-bold text-lg text-gray-900">{formatCurrency(order.total_amount)}</div>
                                </div>
                                <div className={`px - 3 py - 1 rounded - full text - xs font - semibold
                                    ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }
`}>
                                    {STATUS_LABELS[order.status] || order.status}
                                </div>

                                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setSelectedOrder(order)}>
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
