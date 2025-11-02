// src/components/orders/OrderForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2, Plus, X } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";
import { getCustomers } from "@/services/customers";
import { getQualifiedLeads } from "@/services/leads";
import { getProducts } from "@/services/products";
import { formatCurrency } from "@/utils/helper";
import DropdownWithSearch from "@/components/common/DropdownWithSearch";

export default function OrderForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
  paymentLabels = {}, // { code: "VN label" }
  statusLabels = {},  // { code: "VN label" }
}) {
  const today = new Date().toISOString();

  const [form, setForm] = useState({
    order_id: null,
    customer_id: "",
    customer_name: "",
    order_date: today,
    total_amount: 0,
    payment_method: "cash_on_delivery",
    status: "pending",
    channel: "",
    ai_suggested_crosssell: "",
    notes: "",
  });

  const PAYMENT_METHODS = [
    "credit_card",
    "paypal",
    "bank_transfer",
    "cash_on_delivery",
  ];
  const PAYMENT_LABEL_TO_CODE = Object.fromEntries(
    Object.entries(paymentLabels || {}).map(([k, v]) => [v, k])
  );
  const normalizePaymentCode = (val) => PAYMENT_LABEL_TO_CODE[val] || val;

  const ORDER_STATUSES = [
    "paid",
    "pending",
    "cancelled",
    "refunded",
    "failed",
    "processing",
    "shipped",
    "completed",
  ];
  const STATUS_LABEL_TO_CODE = Object.fromEntries(
    Object.entries(statusLabels || {}).map(([k, v]) => [v, k])
  );
  const normalizeStatusCode = (val) => STATUS_LABEL_TO_CODE[val] || val;

  // ===== Data states =====
  const [customers, setCustomers] = useState([]);
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [peopleOptions, setPeopleOptions] = useState([]); // [{kind,id,name,email,phone,raw}]
  const [products, setProducts] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);

  // ===== Hydrate from data (for edit/view) =====
  useEffect(() => {
    if (!data) return;

    setForm({
      order_id: data.order_id || data.orderId || null,
      customer_id: data.customer_id || "",
      customer_name: data.customer_name || "",
      order_date: data.order_date
        ? new Date(data.order_date).toISOString()
        : today,
      total_amount: data.total_amount || data.total || 0,
      payment_method: normalizePaymentCode(data.payment_method) || "cash_on_delivery",
      status: normalizeStatusCode(data.status) || "pending",
      channel: data.channel || "",
      ai_suggested_crosssell: Array.isArray(data.ai_suggested_crosssell)
        ? data.ai_suggested_crosssell.join(", ")
        : data.ai_suggested_crosssell || "",
      notes: data.notes || "",
    });

    if (data.items && data.items.length > 0) {
      setOrderDetails(
        data.items.map((it) => {
          const quantity = Number(it.quantity ?? it.qty ?? 1);
          const price = Number(
            it.price ?? it.unit_price ?? it.price_unit ?? it.price_current ?? 0
          );
          const subtotal = Number(
            it.subtotal ?? it.total_price ?? quantity * price
          );

          let discount = Number(it.discount ?? it.discount_percent ?? 0) || 0;
          if (discount > 1) discount = discount / 100;

          let original_price =
            Number(it.price_original ?? it.original_price ?? it.price_list ?? 0) || 0;
          if (!original_price) {
            original_price = computeOriginalPrice(price, discount);
          }

          return {
            order_detail_id:
              it.order_detail_id ||
              it.id ||
              `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: it.product_id || it.productId || "",
            product_name: it.product_name || it.name || it.productName || "",
            quantity,
            price,
            subtotal,
            discount,
            original_price,
          };
        })
      );
    } else {
      setOrderDetails([]);
    }
  }, [data]);

  // ===== Fetch customers =====
  useEffect(() => {
    let mounted = true;
    getCustomers()
      .then((res) => {
        if (!mounted) return;
        const list = res?.data || res || [];
        setCustomers(list);
      })
      .catch((err) => {
        console.error("Lỗi lấy khách hàng:", err);
        setCustomers([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ===== Fetch qualified leads =====
  useEffect(() => {
    let mounted = true;
    getQualifiedLeads()
      .then((res) => {
        if (!mounted) return;
        const list = res?.data || res || [];
        setQualifiedLeads(list);
      })
      .catch((err) => {
        console.error("Lỗi lấy qualified leads:", err);
        setQualifiedLeads([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ===== Merge people options (customers + qualified leads) =====
  useEffect(() => {
    const customerItems =
      (customers || []).map((c) => ({
        kind: "customer",
        id: c.customer_id,
        name: c.full_name || c.name || c.customer_id,
        email: c.email || "",
        phone: c.phone || c.phone_number || "",
        raw: c,
      })) || [];

    const leadItems =
      (qualifiedLeads || []).map((l) => ({
        kind: "lead",
        id: l.lead_id,
        name: l.name || l.full_name || l.email || l.phone || l.lead_id,
        email: l.email || "",
        phone: l.phone || "",
        raw: l,
      })) || [];

    setPeopleOptions([...customerItems, ...leadItems]);
  }, [customers, qualifiedLeads]);

  // ===== Fetch products =====
  useEffect(() => {
    let mounted = true;
    getProducts()
      .then((res) => {
        if (!mounted) return;
        const list = res?.data || res || [];
        setProducts(list);
      })
      .catch((err) => {
        console.error("Lỗi lấy products:", err);
        setProducts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ===== Autofill orderDetails from products (when product_id present) =====
  useEffect(() => {
    if (!products || products.length === 0) return;

    setOrderDetails((prev) =>
      prev.map((detail) => {
        if (
          (detail.product_name && detail.product_name !== "") ||
          (detail.price && Number(detail.price) > 0)
        ) {
          return {
            ...detail,
            subtotal: Number(detail.quantity || 0) * Number(detail.price || 0),
          };
        }
        const p = products.find(
          (p) => String(p.product_id || p.id) === String(detail.product_id)
        );
        if (p) {
          const priceFromProd = p.price_current ?? p.price ?? 0;
          const qty = Number(detail.quantity || 0);
          let prodDiscount = Number(p.discount ?? p.discount_percent ?? 0) || 0;
          if (prodDiscount > 1) prodDiscount = prodDiscount / 100;

          let original_price =
            Number(p.price_original ?? 0) ||
            computeOriginalPrice(priceFromProd, prodDiscount);

          return {
            ...detail,
            product_name: detail.product_name || p.name || "",
            price: detail.price || Number(priceFromProd),
            discount:
              typeof detail.discount === "number"
                ? detail.discount
                : prodDiscount,
            original_price:
              typeof detail.original_price === "number"
                ? detail.original_price
                : original_price,
            subtotal: qty * Number(detail.price || priceFromProd),
          };
        }
        return {
          ...detail,
          subtotal: Number(detail.quantity || 0) * Number(detail.price || 0),
        };
      })
    );
  }, [products]);

  const handleCancel = () => {
    if (data?.items?.length > 0) {
      setOrderDetails(
        data.items.map((it) => {
          const quantity = Number(it.quantity ?? it.qty ?? 1);
          const price = Number(
            it.price ?? it.unit_price ?? it.price_unit ?? it.price_current ?? 0
          );
          const subtotal = Number(
            it.subtotal ?? it.total_price ?? quantity * price
          );
          let discount = Number(it.discount ?? it.discount_percent ?? 0) || 0;
          if (discount > 1) discount = discount / 100;

          let original_price =
            Number(
              it.price_original ?? it.original_price ?? it.price_list ?? 0
            ) || 0;
          if (!original_price) {
            original_price = computeOriginalPrice(price, discount);
          }

          return {
            order_detail_id:
              it.order_detail_id ||
              it.id ||
              `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: it.product_id || it.productId || "",
            product_name: it.product_name || it.name || "",
            quantity,
            price,
            subtotal,
            discount,
            original_price,
          };
        })
      );
    } else {
      setOrderDetails([]);
    }

    setMode?.("view");
  };

  const handleSubmit = () => {
    // Nếu muốn bắt buộc customer_id, dùng đoạn dưới:
    // if (!form.customer_id) {
    //   toast.error("Vui lòng chọn khách hàng (Customer)");
    //   return;
    // }

    if (!form.customer_id && !form.customer_name) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (orderDetails.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    const totalAmount = orderDetails.reduce(
      (sum, detail) => sum + detail.quantity * detail.price,
      0
    );

    const payload = {
      ...(form.order_id ? { order_id: form.order_id } : {}),
      customer_id: form.customer_id || null,
      order_date: form.order_date
        ? new Date(form.order_date).toISOString()
        : new Date().toISOString(),
      total_amount: totalAmount,
      currency: "VND",
      payment_method: form.payment_method,
      status: form.status,
      channel: form.channel || "",
      notes: form.notes || "",
      items: orderDetails.map((d) => {
        const unitPrice = Number(d.price || 0);
        const qty = Number(d.quantity || 0);
        const orig =
          Number(d.original_price ?? d.price_original ?? d.originalPrice ?? 0) ||
          unitPrice;

        return {
          product_id: d.product_id || null,
          product_name: d.product_name || null,
          quantity: qty,
          discount: Number(d.discount || 0),
          unit_price: unitPrice,
          total_price: Number(qty * unitPrice),
          price_original: orig,
        };
      }),
      ai_suggested_crosssell: (form.ai_suggested_crosssell || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const isCreating = !payload.order_id;
    onSave?.(payload);

    if (!isCreating) {
      setMode?.("view");
    }
  };

  const addOrderDetailWithProduct = (product) => {
    const pid = product.product_id ?? product.id ?? "";
    const price = Number(product.price_current ?? product.price ?? 0);

    let prodDiscount =
      Number(product.discount ?? product.discount_percent ?? 0) || 0;
    if (prodDiscount > 1) prodDiscount = prodDiscount / 100;

    let original_price =
      Number(product.price_original ?? product.price_original ?? 0) || 0;
    if (!original_price) original_price = computeOriginalPrice(price, prodDiscount);

    setOrderDetails((prev) => {
      const idx = prev.findIndex(
        (d) =>
          String(d.product_id) !== "" && String(d.product_id) === String(pid)
      );
      if (idx !== -1) {
        const updated = prev.map((d, i) => {
          if (i === idx) {
            const newQty = Number(d.quantity || 0) + 1;
            return {
              ...d,
              quantity: newQty,
              subtotal: newQty * Number(d.price || price),
            };
          }
          return d;
        });
        toast.info(`${product.name} đã có trong đơn, tăng số lượng lên 1`);
        return updated;
      }
      const newDetail = {
        order_detail_id: `local-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        product_id: pid,
        product_name: product.name ?? "",
        quantity: 1,
        price,
        subtotal: price * 1,
        discount: prodDiscount,
        original_price,
      };
      return [...prev, newDetail];
    });
  };

  const removeOrderDetail = (index) => {
    setOrderDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOrderDetail = (index, field, value) => {
    setOrderDetails((prev) =>
      prev.map((detail, i) => {
        if (i !== index) return detail;
        const updated = { ...detail };

        if (field === "quantity") {
          updated.quantity = Number(value) || 0;
        } else if (field === "price") {
          const p = Number(value) || 0;
          updated.price = p;
          if (!updated.original_price) {
            updated.original_price = computeOriginalPrice(p, updated.discount || 0);
          }
        } else if (field === "discount") {
          let d = Number(value) || 0;
          if (d > 1) d = d / 100;
          updated.discount = d;
          if (!updated.original_price) {
            updated.original_price = computeOriginalPrice(updated.price || 0, d);
          }
        } else if (field === "product_id") {
          updated.product_id = value;
          const product = products.find(
            (p) => String(p.product_id || p.id) === String(value)
          );
          if (product) {
            updated.product_name = product.name || updated.product_name || "";
            updated.price = Number(
              product.price_current ?? product.price ?? updated.price ?? 0
            );
            let prodDiscount =
              Number(product.discount ?? product.discount_percent ?? 0) || 0;
            if (prodDiscount > 1) prodDiscount = prodDiscount / 100;
            updated.discount = prodDiscount;
            updated.original_price =
              Number(product.price_original ?? 0) ||
              computeOriginalPrice(updated.price, prodDiscount);
          }
        } else {
          updated[field] = value;
        }

        updated.subtotal =
          Number(updated.quantity || 0) * Number(updated.price || 0);
        return updated;
      })
    );
  };

  const computeOriginalPrice = (price, discountDecimal) => {
    const p = Number(price || 0);
    let d = Number(discountDecimal || 0);
    if (d > 1) d = d / 100;
    if (d >= 1) return p;
    if (d <= 0) return p;
    return Number((p / (1 - d)).toFixed(2));
  };

  const totalAmount = orderDetails.reduce(
    (sum, detail) => sum + (detail.quantity || 0) * (detail.price || 0),
    0
  );

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Khách hàng
                </label>
                {mode === "view" ? (
                  <div className="text-sm w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {form.customer_name || form.customer_id || "-"}
                  </div>
                ) : (
                  <DropdownWithSearch
                    items={peopleOptions}
                    itemKey={(p) => `${p.kind}:${p.id}`}
                    filterFn={(p, s) => {
                      const q = (s || "").toLowerCase();
                      return (
                        (p.name || "").toLowerCase().includes(q) ||
                        (p.email || "").toLowerCase().includes(q) ||
                        (p.phone || "").toLowerCase().includes(q)
                      );
                    }}
                    onSelect={(p) => {
                      if (p.kind === "customer") {
                        setForm((f) => ({
                          ...f,
                          customer_id: p.id,
                          customer_name: p.name || p.id,
                        }));
                      } else {
                        setForm((f) => ({
                          ...f,
                          customer_id: "",
                          customer_name: p.name || p.id,
                        }));
                        toast.info(
                          "Bạn đang chọn Lead (qualified). Hãy chuyển Lead thành Customer trước khi chốt đơn nếu cần."
                        );
                      }
                    }}
                    placeholder={
                      form.customer_name || form.customer_id || "Chọn khách hàng"
                    }
                    searchPlaceholder="Tìm theo tên, email, số điện thoại..."
                    contentClassName="max-h-72 overflow-y-auto w-[520px] p-2"
                    renderItem={(p) => (
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{p.name}</div>
                          <span
                            className={`text-[10px] px-2 py-[2px] rounded-full ${p.kind === "customer"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {p.kind === "customer"
                              ? "Customer"
                              : "Lead (qualified)"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex gap-3">
                          <span className="truncate">{p.email || "—"}</span>
                          <span className="truncate">{p.phone || "—"}</span>
                        </div>
                      </div>
                    )}
                  >
                    <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                      <span className="text-sm truncate">
                        {form.customer_name ||
                          form.customer_id ||
                          "Chọn khách hàng"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownWithSearch>
                )}
              </div>

              <div className="w-56">
                <label className="block text-sm font-medium mb-1">
                  Ngày đặt hàng
                </label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.order_date ? form.order_date.split("T")[0] : ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order_date: e.target.value }))
                  }
                  className="text-sm w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Phương thức thanh toán
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view"
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">
                        {paymentLabels[form.payment_method] ||
                          form.payment_method}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {PAYMENT_METHODS.map((pm) => (
                      <DropdownMenuItem
                        key={pm}
                        onSelect={() =>
                          setForm((f) => ({ ...f, payment_method: pm }))
                        }
                      >
                        {paymentLabels[pm] || pm}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-56">
                <label className="block text-sm font-medium mb-1">
                  Trạng thái
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view"
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">
                        {statusLabels[form.status] || form.status}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {ORDER_STATUSES.map((st) => (
                      <DropdownMenuItem
                        key={st}
                        onSelect={() =>
                          setForm((f) => ({ ...f, status: st }))
                        }
                      >
                        {statusLabels[st] || st}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Channel + Cross-sell + Notes */}
            <div className="mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kênh (channel)
                </label>
                <input
                  disabled={mode === "view"}
                  value={form.channel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, channel: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="website / phone / store ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gợi ý cross-sell (ai_suggested_crosssell)
                  </label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.ai_suggested_crosssell}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ai_suggested_crosssell: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Nhập các đề xuất, cách nhau bằng dấu phẩy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
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
                  filterFn={(p, s) =>
                    (p.name || p.product_name || "")
                      .toString()
                      .toLowerCase()
                      .includes((s || "").toLowerCase())
                  }
                  onSelect={(p) => addOrderDetailWithProduct(p)}
                  searchPlaceholder="Tìm sản phẩm..."
                  contentClassName="w-96 max-w-full h-96 overflow-y-auto p-2"
                  renderItem={(product) => (
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <span className="truncate">{product.name}</span>
                        <span className="text-xs text-gray-700">
                          {product.price_current
                            ? formatCurrency(product.price_current)
                            : ""}
                        </span>
                      </div>
                      <div className="flex justify-between gap-1 items-center text-xs text-gray-500 mt-1">
                        <div>
                          {product.discount_percent ?? product.discount ? (
                            <span className="text-amber-600 font-medium">
                              Giảm {product.discount_percent ?? product.discount}
                              %
                            </span>
                          ) : null}
                        </div>
                        <div>
                          {product.price_original ? (
                            <span className="line-through">
                              {formatCurrency(product.price_original)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <Button variant="actionCreate">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </DropdownWithSearch>
              )}
            </div>

            <div className="space-y-3">
              {orderDetails.map((detail, index) => (
                <div
                  key={detail.order_detail_id}
                  className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg"
                >
                  {/* Product */}
                  <div className="col-span-3">
                    <label className="block text-sm font-medium mb-1">
                      Sản phẩm
                    </label>
                    {mode === "view" ? (
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm truncate h-10 flex items-center">
                        {detail.product_name || "-"}
                      </div>
                    ) : (
                      <input
                        value={detail.product_name}
                        onChange={(e) =>
                          updateOrderDetail(index, "product_name", e.target.value)
                        }
                        placeholder="Nhập tên sản phẩm hoặc dùng 'Thêm sản phẩm' để chọn"
                        disabled={Boolean(detail.product_id)}
                        className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${detail.product_id
                          ? "bg-gray-50 cursor-not-allowed"
                          : "bg-white"
                          }`}
                      />
                    )}
                  </div>

                  {/* Original price */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Giá gốc
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm h-10 flex items-center">
                      {detail.original_price
                        ? formatCurrency(detail.original_price)
                        : "-"}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Giá bán
                    </label>
                    <input
                      disabled={mode === "view" || Boolean(detail.product_id)}
                      value={formatCurrency(detail.price)}
                      onChange={(e) =>
                        updateOrderDetail(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${mode === "view" || detail.product_id
                        ? "bg-gray-50 cursor-not-allowed"
                        : "bg-white"
                        }`}
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      CK (%)
                    </label>
                    <input
                      disabled={mode === "view" || Boolean(detail.product_id)}
                      type="number"
                      min="0"
                      max="100"
                      value={Number(detail.discount || 0) * 100}
                      onChange={(e) =>
                        updateOrderDetail(
                          index,
                          "discount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${mode === "view" || detail.product_id
                        ? "bg-gray-50 cursor-not-allowed"
                        : "bg-white"
                        }`}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Số lượng
                    </label>
                    <input
                      disabled={mode === "view"}
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) =>
                        updateOrderDetail(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className={`w-full px-3 text-sm border rounded-lg focus:outline-none focus:border-blue-500 h-10 ${mode === "view"
                        ? "bg-gray-50 cursor-not-allowed"
                        : "bg-white"
                        }`}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Thành tiền
                    </label>
                    <input
                      disabled
                      value={formatCurrency(
                        (detail.quantity || 0) * (detail.price || 0)
                      )}
                      className="w-full px-3 text-sm bg-gray-50 border border-gray-300 rounded-lg h-10 flex items-center"
                    />
                  </div>

                  {/* Delete */}
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
      </div>

      {/* Footer actions */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              <b>TỔNG TIỀN:</b>
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(
                orderDetails.reduce(
                  (sum, d) => sum + (d.quantity || 0) * (d.price || 0),
                  0
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === "view" ? (
              <>
                <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                <ConfirmDialog
                  title="Xác nhận xóa"
                  description={
                    <>
                      Bạn có chắc chắn muốn xóa đơn{" "}
                      <span className="font-semibold">#{data?.order_id}</span>?
                    </>
                  }
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
    </div>
  );
}
