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

  // Bảng ánh xạ key → nhãn tiếng Việt - cập nhật theo cấu trúc import
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
    reviews: "Đánh giá",
    category: "Danh mục",
    status: "Trạng thái",
    stock: "Tồn kho"
  };


  // Tạo object chứa tất cả key từ LABELS với giá trị mặc định
  const DEFAULT_FIELDS = Object.keys(LABELS).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      // Đơn giản hóa: chỉ set form = data, không cần mapping phức tạp
      setForm({ ...DEFAULT_FIELDS, ...data });
    } else if (mode === "add") {
      setForm({ ...DEFAULT_FIELDS, status: "Còn hàng", stock: 5 });
    } else {
      setForm({});
    }
  }, [data, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    // Validate với key tiếng Anh
    if (!form.name || form.name.trim() === "") {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!form.brand || form.brand.trim() === "") {
      alert("Vui lòng nhập thương hiệu");
      return;
    }

    if (!form.currentPrice || parseFloat(form.currentPrice) <= 0) {
      alert("Vui lòng nhập giá hiện tại hợp lệ");
      return;
    }

    onSave(form);
  };

  const handleCancel = () => {
    if (mode === "add") {
      setMode?.("close");
    } else {
      setForm(data || {});
      setMode?.("view");
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(form).map(([key, val]) => {
            // Ẩn các field hệ thống
            if (key === 'id') return null;

            // Các trường dài chiếm full width
            const isLongField = [
              'description', 'specs', 'howToUse', 'ingredients', 'fullReview',
              'shortDesc', 'productLink', 'giftOffer'
            ].includes(key);

            const itemClass = isLongField ? "md:col-span-2" : "";

            return (
              <div key={key} className={itemClass}>
                <label className="block text-sm font-medium mb-1">
                  {LABELS[key] || key}
                </label>
                {isLongField ? (
                  <textarea
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(key)}
                    rows={key === 'shortDesc' ? 2 : 4}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    placeholder={`Nhập ${LABELS[key] || key}...`}
                  />
                ) : (
                  <input
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(key)}
                    type={['currentPrice', 'originalPrice', 'currentPriceExtra', 'stock'].includes(key) ? 'number' : 'text'}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder={`Nhập ${LABELS[key] || key}...`}
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