import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { Category, ProductStatus } from "@/lib/data";

export function ProductForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
}) {
  const [form, setForm] = useState({});

  // Bảng ánh xạ key → nhãn tiếng Việt
  const LABELS = {
    name: "Tên sản phẩm",
    brand: "Thương hiệu",
    currentPrice: "Giá hiện tại",
    originalPrice: "Giá gốc",
    discount: "Giảm giá",
    image: "Ảnh",
    productLink: "Link sản phẩm",
    shortDescription: "Mô tả ngắn",
    rating: "Đánh giá sao",
    reviewCount: "Số lượt đánh giá",
    monthlySales: "Mua/tháng",
    salesProgress: "Tiến độ bán",
    giftOffer: "Ưu đãi/Quà tặng",
    source: "Nguồn",
    currentPriceExtra: "Giá hiện tại_extra",
    description: "Mô tả",
    specifications: "Thông số",
    usage: "HDSD",
    ingredients: "Thành phần",
    reviews: "Đánh giá"
  };

  // Tạo object chứa tất cả key từ LABELS với giá trị mặc định là chuỗi rỗng
  const DEFAULT_FIELDS = Object.keys(LABELS).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  useEffect(() => {
    // Nếu có data, merge với defaults để đảm bảo đầy đủ trường
    if (data && Object.keys(data).length > 0) {
      setForm({ ...DEFAULT_FIELDS, ...data });
    } else if (mode === "add") {
      // Khi thêm mới, khởi tạo toàn bộ trường để không bị rỗng
      setForm({ ...DEFAULT_FIELDS });
    } else {
      setForm({});
    }
  }, [data, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    // Validate tên
    if (!form.name && !form["Tên sản phẩm"]) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    // Validate mô tả nếu rỗng (thông báo rõ ràng)
    if (!form.description || form.description.trim() === "") {
      alert("Vui lòng nhập mô tả sản phẩm");
      return;
    }
    onSave(form);
  };

  const handleCancel = () => {
    setForm(data || {});
    setMode?.("view");
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Grid layout: 1 column on small screens, 2 columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(form).map(([key, val]) => {
            // các trường dài sẽ chiếm full width (2 cột trên md+)
            const lower = key.toLowerCase();
            const isLong =
              lower.includes("mô tả") ||
              key === "description" ||
              key === "shortDescription" ||
              key === "specifications" ||
              key === "usage" ||
              key === "ingredients" ||
              key === "reviews";
            const itemClass = isLong ? "md:col-span-2" : "";
            return (
              <div key={key} className={itemClass}>
                <label className="block text-sm font-medium mb-1">
                  {LABELS[key] || key}
                </label>
                {isLong ? (
                  <textarea
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(key)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                  />
                ) : (
                  <input
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(key)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(data?.id)}>
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