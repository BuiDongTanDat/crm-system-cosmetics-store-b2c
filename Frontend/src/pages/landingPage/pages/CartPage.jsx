import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";
import { BoxIcon, Minus, Plus, ShoppingCart, ShoppingCartIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "@/services/orders";
import OrderSubmitModal from "../components/OrderSubmitModal";

export default function CartPage({ onCartChange }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const navigate = useNavigate();

  // Load cart from localStorage
  useEffect(() => {
    const data = localStorage.getItem("cart");
    setCartItems(data ? JSON.parse(data) : []);
  }, []);

  // Triggered when user clicks "Đặt hàng"
  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (guestInfo) => {
    setLoading(true);
    try {
      // Use getDiscountedPrice to handle different price fields structure
      const subtotal = cartItems.reduce((sum, item) => sum + getDiscountedPrice(item) * item.quantity, 0);

      const payload = {
        // Contact Info for Lead/Customer creation
        full_name: guestInfo.full_name,
        phone: guestInfo.phone,
        email: guestInfo.email,
        note: guestInfo.note,
        // Address not collected here, will be on Checkout Page
        shipping_address: "",

        items: cartItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: getDiscountedPrice(i),
          price_original: i.price_original || i.price_unit || 0,
          discount: getDiscountPercent(i) / 100, // Convert % to decimal factor
          total_price: getDiscountedPrice(i) * i.quantity,
          product_name: i.product_name || i.name,
          image: i.image
        })),
        total_amount: subtotal,
        status: 'draft_cart',
        channel: 'web_checkout',
        // Attribution from Storage
        campaign_id: sessionStorage.getItem('attr_campaign_id') || null,
        channel_id: sessionStorage.getItem('attr_channel_id') || null,
      };

      const res = await createOrder(payload);
      if (res && res.order_id) {
        toast.success("Đã tạo đơn hàng!");
        setShowOrderModal(false);
        navigate('/checkout?order_id=' + res.order_id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo đơn hàng: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load cart from localStorage
  useEffect(() => {
    const data = localStorage.getItem("cart");
    setCartItems(data ? JSON.parse(data) : []);
  }, []);

  // Gọi onCartChange khi cartItems thay đổi
  useEffect(() => {
    if (typeof onCartChange === "function") onCartChange();
  }, [cartItems]);

  const handleQuantity = (idx, delta) => {
    setCartItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
    // Cập nhật localStorage và gọi onCartChange
    setTimeout(() => {
      localStorage.setItem("cart", JSON.stringify(
        cartItems.map((item, i) =>
          i === idx
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
      ));
      if (typeof onCartChange === "function") onCartChange();
    }, 0);
  };

  const handleRemove = (idx) => {
    const newCart = cartItems.filter((_, i) => i !== idx);
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCartItems(newCart);
    if (typeof onCartChange === "function") onCartChange();
  };


  // Tính giá sau giảm
  const getDiscountedPrice = (item) => {
    // Nếu có price_current thì dùng luôn, nếu không thì tính từ price_original và discount_percent
    if (item.price_current) return item.price_current;
    if (item.price_original && item.discount_percent) {
      return Math.round(item.price_original * (1 - item.discount_percent / 100));
    }
    return item.price_unit || 0;
  };

  // Tính chiết khấu %
  const getDiscountPercent = (item) => {
    if (item.discount_percent !== undefined) return item.discount_percent;
    if (item.price_original && item.price_current) {
      return Math.round(
        ((item.price_original - item.price_current) / item.price_original) * 100
      );
    }
    return 0;
  };

  const subtotal =
    cartItems?.reduce(
      (sum, item) => sum + getDiscountedPrice(item) * item.quantity,
      0
    ) || 0;
  const totalPayable = subtotal; // Có thể thêm phí vận chuyển, thuế ở đây nếu cần

  return (
    <div className="flex flex-col min-h-screen ">
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto w-full gap-2 py-8 px-2">
        {/* Cart */}
        <div className="flex-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4 flex gap-2 items-center">
            <ShoppingCart />
            Giỏ hàng của bạn
          </h2>
          {cartItems.length === 0 ? (
            <div className="flex flex-col text-center py-12 text-gray-500">
              <BoxIcon className="mx-auto w-10 h-10" />
              Giỏ hàng trống
            </div>
          ) : (
            <>
              {/* Product Table */}
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="py-2">Sản phẩm</th>
                      <th className="py-2 text-right">Giá gốc</th>
                      <th className="py-2 text-right">Chiết khấu</th>
                      <th className="py-2 text-right">Giá sau giảm</th>
                      <th className="py-2 text-center">Số lượng</th>
                      <th className="py-2 text-right">Thành tiền</th>
                      <th className="py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cartItems || []).map((item, idx) => (
                      <tr key={item.product_id || idx} className="border-b justify-center">
                        <td className="py-3 flex items-center gap-3">
                          <img
                            src={item.image || "/default-product-image.png"}
                            alt=""
                            className="w-10 h-10 rounded object-cover border"
                          />
                          <div>
                            <div className="font-medium text-sm ine-clamp-2 max-w-xs">
                              {item.product_name || item.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(item.price_original || item.price_unit || 0)}
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {getDiscountPercent(item)}%
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(getDiscountedPrice(item))}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8"
                              onClick={() => handleQuantity(idx, -1)}
                            >
                              <Minus />
                            </Button>
                            <span className="px-2">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8"
                              onClick={() => handleQuantity(idx, 1)}
                            >
                              <Plus />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-sm text-right">
                          {formatCurrency(getDiscountedPrice(item) * item.quantity)}
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            size="icon"
                            variant="actionDelete"
                            className="w-8 h-8"
                            onClick={() => handleRemove(idx)}
                          >
                            <X />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng kết */}
              <div className="flex flex-col gap-1 items-end text-sm">
                <div className="border-t w-full my-2"></div>
                <div className="flex gap-8 font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totalPayable)}</span>
                </div>
                <Button
                  variant="actionCreate"
                  className="mt-4 px-6 py-3"
                  onClick={handleCheckoutClick}
                  disabled={loading}
                >
                  <ShoppingCartIcon />
                  Đặt hàng
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      <OrderSubmitModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSubmit={handleOrderSubmit}
        isSubmitting={loading}
      />
    </div>
  );
}
