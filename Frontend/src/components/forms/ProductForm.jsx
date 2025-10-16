import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Save, Trash2 } from "lucide-react";
import DropdownOptions from "@/components/ui/DropdownOptions";
import { api } from "@/utils/api";

export function ProductForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
}) {
  const [form, setForm] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([]);

  // ======= Nhãn tiếng Việt =======
  const LABELS = {
    name: "Tên sản phẩm",
    brand: "Thương hiệu",
    short_description: "Mô tả ngắn",
    description: "Mô tả chi tiết",
    category: "Danh mục",
    image: "Ảnh sản phẩm (URL)",
    price_current: "Giá hiện tại (VNĐ)",
    price_original: "Giá gốc (VNĐ)",
    discount_percent: "Giảm giá (%)",
    rating: "Đánh giá (⭐)",
    reviews_count: "Số lượt đánh giá",
    monthly_sales: "Doanh số hàng tháng",
    sell_progress: "Tiến độ bán hàng",
    inventory_qty: "Số lượng tồn kho",
    status: "Trạng thái",
  };

  // ======= Dropdown trạng thái =======
  const STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Còn hàng" },
    { value: "OUT_OF_STOCK", label: "Hết hàng" },
    { value: "DISCONTINUED", label: "Ngừng kinh doanh" },
  ];

  // ======= Default state =======
  const DEFAULT_FIELDS = Object.keys(LABELS).reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});

  // ======= Load data =======
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setForm({
        ...DEFAULT_FIELDS,
        name: data.name ?? "",
        brand: data.brand ?? "",
        short_description: data.short_description ?? "",
        description: data.description ?? "",
        category: data.category ?? "",
        image: data.image ?? "",
        price_current: data.price_current?.toString() ?? "",
        price_original: data.price_original?.toString() ?? "",
        discount_percent: data.discount_percent?.toString() ?? "",
        rating: data.rating?.toString() ?? "",
        reviews_count: data.reviews_count?.toString() ?? "",
        monthly_sales: data.monthly_sales ?? "",
        sell_progress: data.sell_progress ?? "",
        inventory_qty: data.inventory_qty?.toString() ?? "",
        status: data.status ?? "AVAILABLE",
      });
    } else if (mode === "add") {
      setForm({
        ...DEFAULT_FIELDS,
        status: "AVAILABLE",
        inventory_qty: "0",
        discount_percent: "0",
        rating: "0",
        reviews_count: "0",
      });
    } else {
      setForm({});
    }
  }, [data, mode]);

  // fetch categories for category dropdown
  useEffect(() => {
    // Fetch ACTIVE categories and use the category name as the option value
    // so existing products with category names (e.g. "Trang Điểm Môi") will match.
    let cancelled = false;
    (async () => {
      try {
        const { ok, data } = await api.getJson("/category");
        if (!ok || !Array.isArray(data)) return;
        if (cancelled) return;

        const active = data.filter((c) => c && String(c.status) === "ACTIVE");
        const opts = active.map((c) => ({
          // use name as value so it matches product.category strings
          value: c.name ?? String(c.category_id ?? c.id),
          label: c.name ?? String(c.category_id ?? c.id),
        }));

        // If current product has a category name that isn't in the fetched list,
        // add it so the dropdown can show the existing value.
        if (data && typeof data !== "undefined" && (data.length >= 0)) {
          const currentCat = data; // noop, keep linter quiet
        }

        // If the form already has a category (from data) and it's missing in opts, add it
        const existingCatName = (typeof data === "undefined") ? undefined : undefined; // noop
        // actual check: use the prop 'data' (product) available in outer scope
        if (data && false) { /* keep structure - real logic below */ }

        // Build final options and inject product category if needed
        let finalOpts = [...opts];
        if (typeof props !== "undefined") {
          // no-op guard for static analysis; actual using outer-scope `data` and form below
        }

        // If the product passed to the form (prop 'data') has a category string and it's not present, add it
        const prodCategory = (typeof data === "object" && data !== null) ? data.category : undefined;
        if (prodCategory && !finalOpts.some((o) => String(o.value) === String(prodCategory))) {
          finalOpts = [{ value: prodCategory, label: prodCategory }, ...finalOpts];
        }

        if (!cancelled) setCategoryOptions(finalOpts);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  // ======= Handlers =======
  const handleChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name?.trim()) return alert("Vui lòng nhập tên sản phẩm");
    if (!form.brand?.trim()) return alert("Vui lòng nhập thương hiệu");
    if (!form.category?.trim()) return alert("Vui lòng nhập danh mục");
    if (!form.price_current || parseFloat(form.price_current) <= 0)
      return alert("Giá hiện tại phải lớn hơn 0");

    const payload = {
      ...form,
      price_current: parseFloat(form.price_current) || 0,
      price_original: parseFloat(form.price_original) || 0,
      discount_percent: parseFloat(form.discount_percent) || 0,
      rating: parseFloat(form.rating) || 0,
      reviews_count: parseInt(form.reviews_count) || 0,
      inventory_qty: parseInt(form.inventory_qty) || 0,
      // include product_id when editing so parent can PUT to the correct resource
      ...(data?.product_id ? { product_id: data.product_id } : {}),
    };

    onSave(payload);
  };

  const handleCancel = () => {
    if (mode === "add") {
      // prefer setMode if provided, otherwise fallback to calling setForm/data reset
      if (setMode) {
        setMode("close");
      } else {
        // fallback: reset form and attempt to close via parent onDelete/onSave patterns if any
        setForm({});
      }
    } else {
      setForm(data || {});
      setMode?.("view");
    }
  };

  const longFields = ["short_description", "description", "image"];

  // ======= Render =======
  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(LABELS).map(([key, label]) => {
            const isNumeric = [
              "price_current",
              "price_original",
              "discount_percent",
              "rating",
              "reviews_count",
              "inventory_qty",
            ].includes(key);

            const isLong = longFields.includes(key);
            const itemClass = isLong ? "md:col-span-2" : "";

            // Combine category + status into one row so they appear side-by-side
            if (key === "category") {
              return (
                <div key="category-status" className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <DropdownOptions
                      options={categoryOptions}
                      value={form.category}
                      onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                      disabled={mode === "view"}
                      placeholder="Chọn danh mục"
                      width="w-full"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{LABELS.status}</label>
                    <DropdownOptions
                      options={STATUS_OPTIONS}
                      value={form.status}
                      onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                      disabled={mode === "view"}
                      placeholder="Chọn trạng thái"
                      width="w-full"
                    />
                  </div>
                </div>
              );
            }

            // Skip separate rendering for status since it's included with category
            if (key === "status") return null;

            return (
              <div key={key} className={itemClass}>
                <label className="block text-sm font-medium mb-1">{label}</label>

                {isLong ? (
                  <textarea
                    disabled={mode === "view"}
                    value={form[key] || ""}
                    onChange={handleChange(key)}
                    rows={key === "short_description" ? 2 : 4}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    placeholder={`Nhập ${label.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    disabled={mode === "view"}
                    value={form[key] || ""}
                    onChange={handleChange(key)}
                    type={isNumeric ? "number" : "text"}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder={`Nhập ${label.toLowerCase()}...`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======= Footer Buttons ======= */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button
                variant="actionDelete"
                onClick={() => onDelete?.(data?.product_id)}
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
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
  );
}

export default ProductForm;
