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
      // Mapping dữ liệu từ các field có thể có - chuyển tất cả sang tiếng Việt
      const mappedData = {};
      
      // Mapping từ field tiếng Anh sang tiếng Việt
      Object.keys(LABELS).forEach(englishKey => {
        const vietnameseKey = LABELS[englishKey];
        mappedData[vietnameseKey] = data[englishKey] || data[vietnameseKey] || "";
      });

      // Xử lý các field đặc biệt
      mappedData["Trạng thái"] = data.status || data["Trạng thái"] || "Còn hàng";
      mappedData["Tồn kho"] = data.stock || data["Tồn kho"] || 0;

      setForm(mappedData);
    } else if (mode === "add") {
      // Khởi tạo form mới với key tiếng Việt
      const newForm = {};
      Object.values(LABELS).forEach(vietnameseLabel => {
        newForm[vietnameseLabel] = "";
      });
      newForm["Trạng thái"] = "Còn hàng";
      newForm["Tồn kho"] = 0;
      setForm(newForm);
    } else {
      setForm({});
    }
  }, [data, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    // Validate tên sản phẩm
    if (!form["Tên sản phẩm"] || form["Tên sản phẩm"].trim() === "") {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    
    // Validate thương hiệu
    if (!form["Thương hiệu"] || form["Thương hiệu"].trim() === "") {
      alert("Vui lòng nhập thương hiệu");
      return;
    }

    // Validate giá
    if (!form["Giá hiện tại"] || parseFloat(form["Giá hiện tại"]) <= 0) {
      alert("Vui lòng nhập giá hiện tại hợp lệ");
      return;
    }

    // Chuyển đổi lại sang format tiếng Anh khi save
    const englishForm = {};
    Object.entries(LABELS).forEach(([englishKey, vietnameseKey]) => {
      englishForm[englishKey] = form[vietnameseKey] || "";
    });
    englishForm.status = form["Trạng thái"] || "available";
    englishForm.stock = form["Tồn kho"] || 0;

    onSave(englishForm);
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
          {Object.entries(form).map(([vietnameseKey, val]) => {
            
            // Các trường dài chiếm full width
            const isLongField = [
              'Mô tả', 'Thông số', 'HDSD', 'Thành phần', 'Đánh giá', 
              'Mô tả ngắn', 'Link sản phẩm', 'Ưu đãi/Quà tặng'
            ].includes(vietnameseKey);
            
            const itemClass = isLongField ? "md:col-span-2" : "";
            
            return (
              <div key={vietnameseKey} className={itemClass}>
                <label className="block text-sm font-medium mb-1">
                  {vietnameseKey}
                </label>
                {isLongField ? (
                  <textarea
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(vietnameseKey)}
                    rows={vietnameseKey === 'Mô tả ngắn' ? 2 : 4}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    placeholder={`Nhập ${vietnameseKey}...`}
                  />
                ) : (
                  <input
                    disabled={mode === "view"}
                    value={val || ""}
                    onChange={handleChange(vietnameseKey)}
                    type={['Giá hiện tại', 'Giá gốc', 'Giá hiện tại_extra', 'Tồn kho'].includes(vietnameseKey) ? 'number' : 'text'}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder={`Nhập ${vietnameseKey}...`}
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