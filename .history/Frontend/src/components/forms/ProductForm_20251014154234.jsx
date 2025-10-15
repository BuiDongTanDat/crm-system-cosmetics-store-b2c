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
    shortDesc: "Mô tả ngắn",
    rating: "Đánh giá sao",
    reviewCount: "Số lượt đánh giá",
    soldPerMonth: "Mua/tháng",
    progress: "Tiến độ bán",
    giftOffer: "Ưu đãi/Quà tặng",
    source: "Nguồn",
    currentPriceExtra: "Giá hiện tại_extra",
    description: "Mô tả",
    specs: "Thông số",
    howToUse: "HDSD",
    ingredients: "Thành phần",
    fullReview: "Đánh giá",
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
      // Mapping dữ liệu từ các field có thể có
      const mappedData = {
        ...DEFAULT_FIELDS,
        name: data.name || data["Tên sản phẩm"] || "",
        brand: data.brand || data["Thương hiệu"] || "",
        currentPrice: data.currentPrice || data["Giá hiện tại"] || "",
        originalPrice: data.originalPrice || data["Giá gốc"] || "",
        discount: data.discount || data["Giảm giá"] || "",
        image: data.image || data["Ảnh"] || "",
        productLink: data.productLink || data["Link sản phẩm"] || "",
        shortDesc: data.shortDesc || data["Mô tả ngắn"] || "",
        rating: data.rating || data["Đánh giá sao"] || "",
        reviewCount: data.reviewCount || data["Số lượt đánh giá"] || "",
        soldPerMonth: data.soldPerMonth || data["Mua/tháng"] || "",
        progress: data.progress || data["Tiến độ bán"] || "",
        giftOffer: data.giftOffer || data["Ưu đãi/Quà tặng"] || "",
        source: data.source || data["Nguồn"] || "",
        currentPriceExtra: data.currentPriceExtra || data["Giá hiện tại_extra"] || "",
        description: data.description || data["Mô tả"] || "",
        specs: data.specs || data["Thông số"] || "",
        howToUse: data.howToUse || data["HDSD"] || "",
        ingredients: data.ingredients || data["Thành phần"] || "",
        fullReview: data.fullReview || data["Đánh giá"] || "",
        category: data.category || data["Danh mục"] || "",
        status: data.status || data["Trạng thái"] || "available",
        stock: data.stock || data["Tồn kho"] || 0,
        ...data // Giữ lại các field khác
      };
      setForm(mappedData);
    } else if (mode === "add") {
      setForm({ ...DEFAULT_FIELDS, status: "available", stock: 0 });
    } else {
      setForm({});
    }
  }, [data, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    // Validate tên sản phẩm
    if (!form.name || form.name.trim() === "") {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    
    // Validate thương hiệu
    if (!form.brand || form.brand.trim() === "") {
      alert("Vui lòng nhập thương hiệu");
      return;
    }

    // Validate giá
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