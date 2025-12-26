import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/utils/helper";
import { getOrder, getOrderCheckout } from "@/services/orders";
import Loading from "@/components/common/Loading";
import {
  CarFrontIcon,
  CreditCard,
  DollarSign,
  Package,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";
import { set } from "date-fns";
import { toast } from "sonner";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  cancelled: "Đã hủy",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
  shipped: "Đã giao hàng",
  completed: "Hoàn tất",
};

const PAYMENT_LABELS = {
  credit_card: "Thẻ tín dụng",
  paypal: "PayPal",
  bank_transfer: "Chuyển khoản",
  cash_on_delivery: "Thanh toán khi nhận hàng",
};

const SHIPPING_COST = 65000;
const COUPON_DISCOUNT = 65000;

export default function CheckoutPage() {
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [localItems, setLocalItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardInfo, setCardInfo] = useState({
    name: "",
    number: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });

  const fetchOrder = async (id) => {
    setLoading(true);
    try {
      const res = await getOrderCheckout(id);
      console.log("Order checkout data:", res);
      setOrder(res);
      setLocalItems(res?.items || []);
      setPaymentMethod(res?.payment_method || "credit_card");
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
      toast.error("Lỗi khi lấy đơn hàng");
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchOrder(orderId);
  }, [orderId]);

  // Khi order thay đổi (ví dụ reload), cập nhật lại localItems
  useEffect(() => {
    if (order?.items) setLocalItems(order.items);
  }, [order]);

  // Xử lý tăng/giảm số lượng (này tùy có cho phép chỉnh sửa hay không sau khi đã đặt đơn)
  const handleQuantity = (idx, delta) => {
    setLocalItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // Coupon handler (demo)
  const handleApplyCoupon = (coupon) => {
    if (coupon === "FREESHIP") {
      setDiscount(COUPON_DISCOUNT);
      toast.success("Áp dụng mã giảm giá thành công");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
      setDiscount(0);
    }
  };

  // Tổng tiền
  const subtotal =
    localItems?.reduce(
      (sum, item) => sum + item.price_unit * item.quantity,
      0
    ) || 0;
  const totalPayable = subtotal + SHIPPING_COST - discount;

  // Render
  return (
    <div className="flex flex-col min-h-screen ">
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto w-full gap-2 py-8 px-2">
        {/* Cart */}
        <div className="flex-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4 flex gap-2">
            <Package />
            Xác nhận đơn hàng
          </h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loading />
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy đơn hàng
            </div>
          ) : (
            <>
              {/* Thông tin đơn hàng từ API */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Mã đơn hàng</div>
                  <div className="font-semibold">{order.order_id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Khách hàng</div>
                  <div className="font-semibold">
                    {order.customer_name || order.customer_id}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày đặt hàng</div>
                  <div>{formatDateTime(order.order_date)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Trạng thái</div>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div>
                  <div className="text-gray-500">Phương thức thanh toán</div>
                  <div>
                    {PAYMENT_LABELS[order.payment_method] ||
                      order.payment_method}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Kênh</div>
                  <div>{order.channel || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ghi chú</div>
                  <div>{order.notes || "-"}</div>
                </div>
              </div>
              {/* Product Table */}
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="py-2">Sản phẩm</th>
                      <th className="py-2 text-right">Giá gốc</th>
                      <th className="py-2 text-right">Chiết khấu</th>
                      <th className="py-2 text-right">Giá </th>
                      <th className="py-2 text-center">Số lượng</th>
                      <th className="py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(localItems || []).map((item, idx) => (
                      <tr
                        key={item.order_detail_id}
                        className="border-b align-top"
                      >
                        <td className="py-3 flex items-center gap-3">
                          {/* Không có ảnh từ API, dùng ảnh mặc định */}
                          <img
                            src={item.image || "/default-product-image.png"}
                            alt=""
                            className="w-10 h-10 rounded object-cover border"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {item.product_name}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(item.price_original)}
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {item.discount * 100 || 0}%
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(item.price_unit)}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8"
                              onClick={() => handleQuantity(idx, -1)}
                            >
                              -
                            </Button>
                            <span className="px-2">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8"
                              onClick={() => handleQuantity(idx, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </td>

                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(
                            item.price_unit *
                              item.quantity *
                              (1 - (item.discount || 0))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-end gap-6">
                {/* Coupon - LEFT */}
                <div className="flex-1">
                  <div className="font-semibold mb-2">Mã giảm giá</div>
                  <div className="flex gap-2">
                    <Input
                      variant="normal"
                      placeholder="Nhập mã giảm giá"
                      onChange={(e) => setCoupon(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      variant="actionUpdate"
                      onClick={() => handleApplyCoupon(coupon)}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>

                {/* Summary - RIGHT */}
                <div className="flex flex-col text-sm text-right">
                  <span>Tạm tính: {formatCurrency(subtotal)}</span>
                  <span>Phí vận chuyển: {formatCurrency(SHIPPING_COST)}</span>
                  <span>Giảm giá coupon: {formatCurrency(discount)}</span>
                </div>
              </div>

              {/* Tổng kết */}
              <div className="flex flex-col gap-1 items-end text-sm">
                <div className="border-t w-full my-2"></div>
                <div className="flex gap-8 font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totalPayable)}</span>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Payment Info */}
        <div className=" bg-white rounded-xl shadow p-6 flex-1 flex-col">
          <h2 className="text-2xl font-semibold mb-4">Thông tin thanh toán</h2>
          {/* Payment method */}
          <div className="mb-4">
            <div className="font-medium mb-2">Phương thức thanh toán</div>
            <div className="flex flex-col gap-2">
              <div className="space-y-3">
                {/* Credit Card */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                        ${
                          paymentMethod === "credit_card"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-500"
                        }
                        `}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                  />
                  <span className="font-medium flex gap-2">
                    <CreditCard />
                    Thẻ tín dụng
                  </span>
                </label>

                {/* Paypal */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                    ${
                      paymentMethod === "paypal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-500"
                    }
                    `}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  <span className="font-medium flex gap-2">
                    <DollarSign />
                    Paypal
                  </span>
                </label>

                {/* COD */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                        ${
                          paymentMethod === "cash_on_delivery"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-500"
                        }
                        `}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={() => setPaymentMethod("cash_on_delivery")}
                  />
                  <span className="font-medium flex gap-2">
                    <PackageCheck />
                    Thanh toán khi nhận hàng
                  </span>
                </label>
              </div>
            </div>
          </div>
          {/* Card info */}
          {paymentMethod === "credit_card" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Tên trên thẻ:
              </label>
              <Input
                variant="normal"
                placeholder={order?.customer_name || "Nguyen Van A"}
                value={cardInfo.name}
                onChange={(e) =>
                  setCardInfo((ci) => ({ ...ci, name: e.target.value }))
                }
                className="mb-2"
              />
              <label className="block text-sm font-medium mb-1">Số thẻ</label>
              <Input
                variant="normal"
                placeholder="0000 0000 0000 1235"
                value={cardInfo.number}
                onChange={(e) =>
                  setCardInfo((ci) => ({ ...ci, number: e.target.value }))
                }
                className="mb-2"
              />
              <div className="flex gap-2 justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày hết hạn
                  </label>
                  <div className="flex gap-2 ">
                    <Input
                      variant="normal"
                      placeholder="MM"
                      value={cardInfo.expMonth}
                      onChange={(e) =>
                        setCardInfo((ci) => ({
                          ...ci,
                          expMonth: e.target.value,
                        }))
                      }
                      className="w-16"
                    />
                    <Input
                      variant="normal"
                      placeholder="YYYY"
                      type="year"
                      value={cardInfo.expYear}
                      onChange={(e) =>
                        setCardInfo((ci) => ({
                          ...ci,
                          expYear: e.target.value,
                        }))
                      }
                      className="w-20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <Input
                    variant="normal"
                    placeholder="248"
                    value={cardInfo.cvv}
                    onChange={(e) =>
                      setCardInfo((ci) => ({ ...ci, cvv: e.target.value }))
                    }
                    className="w-40"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Place Order */}
          <Button
            variant="actionCreate"
            className="mt-4 w-full h-12 text-lg font-semibold flex gap-1 active:scale-95 hover:shadow-lg hover:scale-105"
          >
            <ShoppingCart className="!w-7 !h-7" />
            Đặt hàng
          </Button>
        </div>
      </div>
    </div>
  );
}
