import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Edit, Save, Trash2, Plus, X } from "lucide-react";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import { getCustomers } from "@/services/customers";
import { getProducts } from "@/services/products";
import { formatCurrency } from "@/utils/helper";
import { Input } from "@/components/ui/input";
import DropdownWithSearch from '@/components/common/DropdownWithSearch';
import DropdownOptions from '@/components/common/DropdownOptions';

export function OrderForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
  paymentLabels = {}, // { code: "VN label" } CHỗ này mình truyeenf lable Tiếng Việt qua dùng luôn nha
  statusLabels = {}   // { code: "VN label" }
}) {
  // Lấy ngày hiện tại ở định dạng YYYY-MM-DD để gán sẵn khi tạo đơn hàng mới nè
  const today = new Date().toISOString(); // Ensure valid ISO string

  const [form, setForm] = useState({
    order_id: null,
    customer_id: "",
    customer_name: "",
    // Gán vô đây
    order_date: today,
    total_amount: 0,
    //  Mặc định
    payment_method: 'cash_on_delivery',
    status: 'pending',
    channel: "", // e.g. "website"
    ai_suggested_crosssell: "", // Chưa code
    notes: "",
  });

  // Bind sang để hiển thị tiếng Việt
  const PAYMENT_METHODS = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
  // paymentLabels passed via props (paymentLabels[code] -> VN label)
  const PAYMENT_LABEL_TO_CODE = Object.fromEntries(Object.entries(paymentLabels || {}).map(([k, v]) => [v, k]));
  const normalizePaymentCode = (val) => PAYMENT_LABEL_TO_CODE[val] || val;

  const ORDER_STATUSES = ['paid', 'pending', 'cancelled', 'refunded', 'failed', 'processing', 'shipped', 'completed'];
  // statusLabels passed via props (statusLabels[code] -> VN label)
  const STATUS_LABEL_TO_CODE = Object.fromEntries(Object.entries(statusLabels || {}).map(([k, v]) => [v, k]));
  const normalizeStatusCode = (val) => STATUS_LABEL_TO_CODE[val] || val;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  // change initial details: start empty (no default blank row)
  const [orderDetails, setOrderDetails] = useState([]);

  useEffect(() => {
    if (data) {
      setForm({
        order_id: data.order_id || data.orderId || null,
        customer_id: data.customer_id || "",
        customer_name: data.customer_name || "",
        order_date: data.order_date ? new Date(data.order_date).toISOString() : today, // Ensure valid ISO string
        total_amount: data.total_amount || data.total || 0,
        // normalize in case incoming data accidentally contains VN labels
        payment_method: normalizePaymentCode(data.payment_method) || 'cash_on_delivery',
        status: normalizeStatusCode(data.status) || 'pending',
        channel: data.channel || "",
        ai_suggested_crosssell: Array.isArray(data.ai_suggested_crosssell) ? data.ai_suggested_crosssell.join(', ') : (data.ai_suggested_crosssell || ""),
        notes: data.notes || "",
      });

      if (data.items && data.items.length > 0) {
        setOrderDetails(data.items.map(it => {
          const quantity = Number(it.quantity ?? it.qty ?? 1);
          const price = Number(it.price ?? it.unit_price ?? it.price_unit ?? it.price_current ?? 0);
          const subtotal = Number(it.subtotal ?? it.total_price ?? (quantity * price));
          // parse discount: use explicit discount if provided, otherwise convert discount_percent -> decimal
          const rawDisc = it.discount ?? it.discount_percent ?? 0;
          let discount = Number(rawDisc) || 0;
          if (discount > 1) discount = discount / 100;
          // original price from item if provided; otherwise compute from price+discount
          let original_price = Number(it.price_original ?? it.original_price ?? it.price_list ?? 0) || 0;
          if (!original_price) {
            original_price = computeOriginalPrice(price, discount);
          }
          return {
            order_detail_id: it.order_detail_id || it.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: it.product_id || it.productId || "",
            product_name: it.product_name || it.name || it.productName || "",
            quantity,
            price,
            subtotal,
            discount,
            original_price
          };
        }));
      } else {
        // no items -> keep empty (remove default blank row)
        setOrderDetails([]);
      }
    }
  }, [data]);

  // fetch Danh sách Khách hàng cho việc chọn lựa
  useEffect(() => {
    let mounted = true;
    getCustomers()
      .then(res => {
        if (!mounted) return;
        const list = res?.data || res || [];
        setCustomers(list);
      })
      .catch(err => {
        console.error("Lỗi lấy khách hàng:", err);
        setCustomers([]);
      });
    return () => { mounted = false; };
  }, []);

  // fetch Dach sách sản phẩm
  useEffect(() => {
    let mounted = true;
    getProducts()
      .then(res => {
        if (!mounted) return;
        const list = res?.data || res || [];
        setProducts(list);
      })
      .catch(err => {
        console.error("Lỗi lấy products:", err);
        setProducts([]);
      });
    return () => { mounted = false; };
  }, []);

  // Tự động điền tên sản phẩm và giá khi có products trong danh sách chi tiết đơn hàng 
  useEffect(() => {
    if (!products || products.length === 0) return;
    setOrderDetails(prev => prev.map(detail => {
      // ONLY autofill when the detail has neither product_name nor price.
      // This prevents overwriting values that came from the order itself.
      if ((detail.product_name && detail.product_name !== "") || (detail.price && Number(detail.price) > 0)) {
        return { ...detail, subtotal: (Number(detail.quantity || 0) * Number(detail.price || 0)) };
      }
      const p = products.find(p => String(p.product_id || p.id) === String(detail.product_id));
      if (p) {
        const priceFromProd = p.price_current ?? p.price ?? 0;
        const qty = Number(detail.quantity || 0);
        // normalize product discount_percent -> decimal
        const rawDisc = p.discount ?? p.discount_percent ?? 0;
        let prodDiscount = Number(rawDisc) || 0;
        if (prodDiscount > 1) prodDiscount = prodDiscount / 100;
        // original price from product or compute
        let original_price = Number(p.price_original ?? 0) || 0;
        if (!original_price) original_price = computeOriginalPrice(priceFromProd, prodDiscount);
        return {
          ...detail,
          product_name: detail.product_name || p.name || "",
          price: detail.price || priceFromProd,
          // only set discount when detail doesn't already have one
          discount: typeof detail.discount === 'number' ? detail.discount : prodDiscount,
          original_price: typeof detail.original_price === 'number' ? detail.original_price : original_price,
          subtotal: qty * (detail.price || priceFromProd)
        };
      }
      return { ...detail, subtotal: (Number(detail.quantity || 0) * Number(detail.price || 0)) };
    }));
  }, [products]);

  const handleCancel = () => {
    if (data.items && data.items.length > 0) {
      setOrderDetails(data.items.map(it => {
        const quantity = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? it.unit_price ?? it.price_unit ?? it.price_current ?? 0);
        const subtotal = Number(it.subtotal ?? it.total_price ?? (quantity * price));

        // parse discount
        const rawDisc = it.discount ?? it.discount_percent ?? 0;
        let discount = Number(rawDisc) || 0;
        if (discount > 1) discount = discount / 100;

        // compute original_price
        let original_price = Number(it.price_original ?? it.original_price ?? it.price_list ?? 0) || 0;
        if (!original_price) {
          original_price = computeOriginalPrice(price, discount);
        }

        return {
          order_detail_id: it.order_detail_id || it.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: it.product_id || it.productId || "",
          product_name: it.product_name || it.name || "",
          quantity,
          price,
          subtotal,
          discount,
          original_price
        };
      }));
    } else {
      setOrderDetails([]);
    }

    setMode?.("view");
  };

  const handleSubmit = () => {
    if (!form.customer_id && !form.customer_name) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (orderDetails.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    const totalAmount = orderDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

    // Build payload matching the backend JSON you provided
    const payload = {
      // keep order_id if present (for updates)
      ...(form.order_id ? { order_id: form.order_id } : {}),
      customer_id: form.customer_id || null,
      // send an ISO timestamp for order_date (backend example includes time + Z)
      order_date: form.order_date ? new Date(form.order_date).toISOString() : new Date().toISOString(),
      total_amount: totalAmount,
      currency: "VND",
      payment_method: form.payment_method,
      status: form.status,
      channel: form.channel || "",
      notes: form.notes || "",
      // map items to backend shape: product_id, quantity, discount, unit_price, total_price
      items: orderDetails.map(d => {
        const unitPrice = Number(d.price || 0);
        const qty = Number(d.quantity || 0);
        // prefer explicit original_price field; fall back to any variant, else use unitPrice
        const orig = Number(d.original_price ?? d.price_original ?? d.originalPrice ?? 0) || unitPrice;

        return {
          product_id: d.product_id || null,
          product_name: d.product_name || null,
          quantity: qty,
          discount: Number(d.discount || 0),
          unit_price: unitPrice,
          total_price: Number(qty * unitPrice),
          price_original: orig
        };
      }),
      // keep ai suggestions as array (backend may expect array)
      ai_suggested_crosssell: (form.ai_suggested_crosssell || "")
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    };

    const isCreating = !payload.order_id;
    onSave?.(payload);

    if (!isCreating) {
      setMode?.("view");
    } else {
      // keep dialog open or let caller (onSave) decide; UI page will close if it wants
    }
  };

  // New: add a product from the product list when user selects it from the "Thêm sản phẩm" dropdown
  const addOrderDetailWithProduct = (product) => {
    const pid = product.product_id ?? product.id ?? "";
    const price = Number(product.price_current ?? product.price ?? 0);

    const rawDisc = product.discount ?? product.discount_percent ?? 0;
    let prodDiscount = Number(rawDisc) || 0;
    if (prodDiscount > 1) prodDiscount = prodDiscount / 100;

    // original price from product or compute if missing
    let original_price = Number(product.price_original ?? product.price_original ?? 0) || 0;
    if (!original_price) original_price = computeOriginalPrice(price, prodDiscount);

    // check duplicate by product_id
    setOrderDetails(prev => {
      const idx = prev.findIndex(d => String(d.product_id) !== "" && String(d.product_id) === String(pid));
      if (idx !== -1) {
        const updated = prev.map((d, i) => {
          if (i === idx) {
            const newQty = Number(d.quantity || 0) + 1;
            return { ...d, quantity: newQty, subtotal: newQty * Number(d.price || price) };
          }
          return d;
        });
        toast.info(`${product.name} đã có trong đơn, tăng số lượng lên 1`);
        return updated;
      }
      const newDetail = {
        order_detail_id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product_id: pid,
        product_name: product.name ?? "",
        quantity: 1,
        price,
        subtotal: price * 1,
        discount: prodDiscount,
        original_price
      };
      return [...prev, newDetail];
    });
  };

  const removeOrderDetail = (index) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateOrderDetail = (index, field, value) => {
    setOrderDetails(prev => prev.map((detail, i) => {
      if (i === index) {
        const updated = { ...detail };

        if (field === 'quantity') {
          const q = Number(value) || 0;
          updated.quantity = q;
        } else if (field === 'price') {
          const p = Number(value) || 0;
          updated.price = p;
          // if original_price not present, compute from new price + discount
          if (!updated.original_price) {
            updated.original_price = computeOriginalPrice(p, updated.discount || 0);
          }
        } else if (field === 'discount') {
          let d = Number(value) || 0;
          if (d > 1) d = d / 100;
          updated.discount = d;
          // recompute original_price only if not provided by backend
          if (!updated.original_price) {
            updated.original_price = computeOriginalPrice(updated.price || 0, d);
          }
        } else if (field === 'product_id') {
          // ...existing code to overwrite from product...
          updated.product_id = value;
          const product = products.find(p => String(p.product_id || p.id) === String(value));
          if (product) {
            updated.product_name = product.name || updated.product_name || "";
            updated.price = Number(product.price_current ?? product.price ?? updated.price ?? 0);
            const rawDisc = product.discount ?? product.discount_percent ?? 0;
            let prodDiscount = Number(rawDisc) || 0;
            if (prodDiscount > 1) prodDiscount = prodDiscount / 100;
            updated.discount = prodDiscount;
            updated.original_price = Number(product.price_original ?? 0) || computeOriginalPrice(updated.price, prodDiscount);
          }
        } else {
          updated[field] = value;
        }

        updated.subtotal = (Number(updated.quantity || 0) * Number(updated.price || 0));
        return updated;
      }
      return detail;
    }));
  };

  // Tính lại giá gốc từ giá bán và chiết khấu
  const computeOriginalPrice = (price, discountDecimal) => {
    const p = Number(price || 0);
    let d = Number(discountDecimal || 0);
    if (d > 1) d = d / 100; // tolerate percent input
    if (d >= 1) return p; // avoid division by zero
    if (d <= 0) return p;
    return Number((p / (1 - d)).toFixed(2));
  };

  const totalAmount = orderDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Khách hàng</label>
                {mode === "view" ? (
                  <div className="  text-sm w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {form.customer_name || form.customer_id || '-'}
                  </div>
                ) : (
                  <DropdownWithSearch
                    items={customers}
                    itemKey={(c) => c.customer_id}
                    renderItem={(c) => (c.full_name || c.customer_id)}
                    filterFn={(c, s) => (c.full_name || c.customer_id || '').toString().toLowerCase().includes((s || '').toLowerCase())}
                    onSelect={(c) => setForm(f => ({ ...f, customer_id: c.customer_id, customer_name: c.full_name || c.customer_id }))}
                    placeholder={form.customer_name || form.customer_id || "Chọn khách hàng"}
                    searchPlaceholder="Tìm kiếm khách hàng..."
                    contentClassName="max-h-64 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                      <span className="text-sm truncate">{form.customer_name || form.customer_id || "Chọn khách hàng"}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownWithSearch>
                )}
              </div>

              <div className="w-56">
                <label className="block text-sm font-medium mb-1">Ngày đặt hàng</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.order_date ? form.order_date.split("T")[0] : ""}
                  onChange={(e) => setForm(f => ({ ...f, order_date: e.target.value }))}
                  className=" text-sm w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Phương thức thanh toán</label>
                <DropdownOptions
                  options={PAYMENT_METHODS.map(pm => ({ value: pm, label: paymentLabels[pm] || pm }))}
                  value={form.payment_method}
                  onChange={(val) => setForm(f => ({ ...f, payment_method: val }))}
                  disabled={mode === "view"}
                  width="w-full"
                />
              </div>

              <div className="w-56">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownOptions
                  options={ORDER_STATUSES.map(st => ({ value: st, label: statusLabels[st] || st }))}
                  value={form.status}
                  onChange={(val) => setForm(f => ({ ...f, status: val }))}
                  disabled={mode === "view"}
                  width="w-56"
                />
              </div>
            </div>

            {/* Kênh trên cùng, gợi ý + ghi chú cùng hàng */}
            <div className="mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kênh (channel)</label>
                <input
                  disabled={mode === "view"}
                  value={form.channel}
                  onChange={(e) => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="website / phone / store ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Gợi ý cross-sell (ai_suggested_crosssell)</label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.ai_suggested_crosssell}
                    onChange={(e) => setForm(f => ({ ...f, ai_suggested_crosssell: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Nhập các đề xuất, cách nhau bằng dấu phẩy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ghi chú</label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Ghi chú đơn (ví dụ: Giao giờ hành chính, liên hệ trước 30 phút)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Chi tiết đơn hàng</h3>
              {mode === "edit" && (
                <DropdownWithSearch
                  items={products}
                  itemKey={(p) => p.product_id ?? p.id}
                  filterFn={(p, s) => (p.name || p.product_name || '').toString().toLowerCase().includes((s || '').toLowerCase())}
                  onSelect={(p) => addOrderDetailWithProduct(p)}
                  searchPlaceholder="Tìm sản phẩm..."
                  contentClassName="w-96  max-w-full h-96 overflow-y-auto p-2"
                  renderItem={(product) => (
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <span className="truncate font">{product.name}</span>
                        <span className="text-xs text-gray-700">{product.price_current ? formatCurrency(product.price_current) : ''}</span>
                      </div>
                      <div className="flex justify-between gap-1 items-center text-xs text-gray-500 mt-1">
                        <div>
                          {(product.discount_percent ?? product.discount) ? <span className="text-amber-600 font-medium">Giảm {(product.discount_percent ?? product.discount)}%</span> : null}
                        </div>
                        <div>
                          {product.price_original ? <span className="line-through">{formatCurrency(product.price_original)}</span> : null}
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <Button variant="actionCreate" >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </DropdownWithSearch>
              )}
            </div>

            <div className="space-y-3">
              {orderDetails.map((detail, index) => (
                <div key={detail.order_detail_id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                  {/* Product column (2) */}
                  <div className="col-span-3">
                    <label className="block text-sm font-medium mb-1">Sản phẩm</label>
                    {mode === "view" ? (
                      <div className=" w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm truncate h-10 flex items-center">
                        {detail.product_name || '-'}
                      </div>
                    ) : (
                      <input
                        value={detail.product_name}
                        onChange={(e) => updateOrderDetail(index, 'product_name', e.target.value)}
                        placeholder="Nhập tên sản phẩm hoặc dùng 'Thêm sản phẩm' để chọn"
                        disabled={Boolean(detail.product_id)}
                        className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${detail.product_id ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                      />
                    )}
                  </div>

                  {/* Original price column (1) */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Giá gốc</label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm h-10 flex items-center">
                      {detail.original_price ? formatCurrency(detail.original_price) : '-'}
                    </div>
                  </div>

                  {/* Price column (2) */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Giá bán</label>
                    <input
                      disabled={mode === "view" || Boolean(detail.product_id)}
                      value={formatCurrency(detail.price)}
                      onChange={(e) => updateOrderDetail(index, 'price', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${(mode === "view" || detail.product_id) ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  {/* Discount column (2) */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">CK (%)</label>
                    <input
                      disabled={mode === "view" || Boolean(detail.product_id)}
                      type="number"
                      min="0"
                      max="100"
                      value={Number(detail.discount || 0) * 100}
                      onChange={(e) => updateOrderDetail(index, 'discount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${(mode === "view" || detail.product_id) ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  {/* Quantity column (1) */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">Số lượng</label>
                    <input
                      disabled={mode === "view"}
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => updateOrderDetail(index, 'quantity', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${mode === "view" ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  {/* Subtotal column (2) */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Thành tiền</label>
                    <input
                      disabled
                      value={formatCurrency((detail.quantity || 0) * (detail.price || 0))}
                      className="w-full px-3 text-sm bg-gray-50 border border-gray-300 rounded-lg h-10 flex items-center"
                    />
                  </div>

                  {/* Delete column (1) */}
                  <div className="col-span-1">
                    {mode === "edit" && (
                      <Button
                        type="button"
                        variant="actionDelete"
                        size="sm"
                        onClick={() => removeOrderDetail(index)}
                        className="w-full h-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div >

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: total amount */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500"><b>TỔNG TIỀN:</b></div>
            <div className="text-lg font-semibold">{formatCurrency(totalAmount)}</div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {mode === "view" ? (
              <>
                <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                <ConfirmDialog
                  title="Xác nhận xóa"
                  description={<>Bạn có chắc chắn muốn xóa đơn <span className="font-semibold">#{data?.order_id}</span>?</>}
                  confirmText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => onDelete?.(data?.order_id)}
                >
                  <Button variant="actionDelete">
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </Button>
                </ConfirmDialog>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} variant="actionUpdate">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

export default OrderForm;
